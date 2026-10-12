# #1669: sort the components under a path by what OnPush would do to them, and optionally remove
# ChangeDetectionStrategy.Eager from the ones a scan finds nothing against.
#   python onpush-scan.py <repo> <path prefix> [--apply]
import os, re, subprocess, sys
os.chdir(sys.argv[1])
prefix = sys.argv[2]
apply = '--apply' in sys.argv
files = [f for f in subprocess.run(['git', 'ls-files', prefix], capture_output=True, text=True).stdout.split()
         if f.endswith('.ts') and not f.endswith('.spec.ts') and not re.search(r'oidc|signage|/nest/|-nest/|data-api', f)]


def read(f): return open(f, encoding='utf-8', newline='').read()


def template_of(f, s):
    m = re.search(r"templateUrl:\s*'([^']+)'", s)
    if m:
        p = os.path.normpath(os.path.join(os.path.dirname(f), m.group(1)))
        return read(p) if os.path.exists(p) else ''
    m = re.search(r'template:\s*`(.*?)`', s, re.S)
    return m.group(1) if m else ''


groups = {'clean': [], 'subscribes': [], 'assigns': [], 'decorator input': [], 'reads a service in the template': [], 'extends a class': []}
for f in files:
    s = read(f)
    if '@Component(' not in s or 'ChangeDetectionStrategy.Eager' not in s:
        continue
    t = template_of(f, s)
    assigns = bool(re.search(r'\.(subscribe|then)\(\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>\s*\{[^}]*this\.\w+(?:\.\w+)*\s*(?:=[^=]|\+\+|--|\.push\()', s, re.S)) \
        or bool(re.search(r'setTimeout|setInterval|requestAnimationFrame|addEventListener|\.on\(|\.watch\(', s))
    # a service or plain object read straight from the template: its changes are invisible to OnPush
    injected = set(re.findall(r'(?:public|protected)?\s*(?:readonly\s+)?(\w+)\s*=\s*inject\(', s))
    reads_service = any(re.search(r'(?<![\w.])' + re.escape(n) + r'\.\w+', t) for n in injected)
    if assigns: groups['assigns'].append(f)
    elif re.search(r'\.subscribe\(', s): groups['subscribes'].append(f)
    elif reads_service: groups['reads a service in the template'].append(f)
    elif re.search(r'@Input\(', s): groups['decorator input'].append(f)
    elif re.search(r'export (?:abstract )?class \w+(?:<[^{]*?>)?\s+extends\s', s, re.S) or 'NG_VALUE_ACCESSOR' in s: groups['extends a class'].append(f)
    else: groups['clean'].append(f)

for k, v in groups.items():
    print(f'{len(v):4d}  {k}')
if '--list' in sys.argv:
    for k, v in groups.items():
        if k == 'clean': continue
        for f in v: print('   ', k, '|', f.replace(prefix, ''))

if apply:
    n = 0
    for f in groups['clean']:
        s = read(f)
        s2 = re.sub(r'\n[ \t]*changeDetection: ChangeDetectionStrategy\.Eager,?[ \t]*(?=\n)', '', s, count=1)
        assert s2 != s, f
        # a trailing comma left before the closing brace of the decorator is fine for Prettier to settle
        if not re.search(r'\bChangeDetectionStrategy\b', s2.replace('import', '', 1) if False else re.sub(r"import \{[^}]*\} from '@angular/core';", '', s2)):
            s2 = re.sub(r"(import \{[^}]*?)\bChangeDetectionStrategy,\s*", r'\1', s2, count=1)
            s2 = re.sub(r"(import \{[^}]*?),\s*ChangeDetectionStrategy(\s*\})", r'\1\2', s2, count=1)
        open(f, 'w', encoding='utf-8', newline='').write(s2)
        n += 1
    print('Eager removed from', n, 'components')
