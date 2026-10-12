# Remove the migration's "TODO: Skipped for migration because:" comment blocks from the code, and write what
# they said, once per input, to a list: file, input name, reason.
import os, re, subprocess, sys, collections
os.chdir(sys.argv[1])
out = sys.argv[2]
files = [f for f in subprocess.run(['git', 'grep', '-l', 'TODO: Skipped for migration because:', '--', 'libs', 'apps'], capture_output=True, text=True).stdout.split()]
rows, tally = [], collections.Counter()
for f in files:
    lines = open(f, encoding='utf-8', newline='').read().split('\n')
    keep, i = [], 0
    while i < len(lines):
        if 'TODO: Skipped for migration because:' in lines[i]:
            reasons = []
            # one or more blocks: a TODO line, then indented comment lines giving the reason
            while i < len(lines) and 'TODO: Skipped for migration because:' in lines[i]:
                i += 1
                text = []
                while i < len(lines) and re.match(r'\s*//\s{2,}\S', lines[i]):
                    text.append(re.sub(r'^\s*//\s*', '', lines[i])); i += 1
                reasons.append(' '.join(text))
            # the input this sits above
            j = i
            name = ''
            while j < len(lines) and j < i + 8:
                m = re.search(r"(?:public |private |protected )?(?:set |get )?(\w+)\s*(?:[:=(?!]|$)", re.sub(r'@Input\([^)]*\)', '', lines[j]).strip()) if '@' not in re.sub(r'@Input\([^)]*\)', '', lines[j]) and lines[j].strip() else None
                if m and m.group(1) not in ('public', 'private', 'protected', 'set', 'get'):
                    name = m.group(1); break
                j += 1
            reason = reasons[0].split('. ')[0].rstrip('.')
            rows.append((f, name, reason)); tally[reason] += 1
            continue
        keep.append(lines[i]); i += 1
    open(f, 'w', encoding='utf-8', newline='').write('\n'.join(keep))
open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join('\t'.join(r) for r in rows) + '\n')
for r, n in tally.most_common():
    print(n, r)
print('inputs with a reason:', len(rows), 'in', len(files), 'files')
