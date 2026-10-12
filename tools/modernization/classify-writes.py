# #1657: for each input the migration skipped because "code writes to the input", find where the writes are.
# Usage: python classify-writes.py <repo> <skipped-inputs.tsv>
import os, re, subprocess, sys, collections
os.chdir(sys.argv[1])
rows = [l.rstrip('\n').split('\t') for l in open(sys.argv[2], encoding='utf-8') if l.strip()]
rows = [r for r in rows if r[2].startswith('Your application code writes')]
ts = [f for f in subprocess.run(['git', 'ls-files', 'libs', 'apps'], capture_output=True, text=True).stdout.split()
      if f.endswith(('.ts', '.html')) and not re.search(r'oidc|signage|/nest/|-nest/|data-api', f)]
src = {}
def read(f):
    if f not in src:
        src[f] = open(f, encoding='utf-8').read()
    return src[f]

out = []
for f, name, _ in rows:
    cls = (re.search(r'export (?:abstract )?class (\w+)', read(f)) or [None, '?'])[1]
    own = [m.start() for m in re.finditer(r'\bthis\.' + re.escape(name) + r'\s*(=(?!=)|\+=|-=|\+\+|--|\.push\(|\.splice\()', read(f))]
    spec, other = [], []
    for g in ts:
        if g == f: continue
        s = read(g)
        if cls not in s and name not in s: continue
        # writes through an instance: component.name = ..., fixture.componentInstance.name = ...
        hits = re.findall(r'\b(?:component|comp|instance|componentInstance|directive|host|cmp|\w+Component|\w+Ref\.instance)\.' + re.escape(name) + r'\s*=(?!=)', s)
        if not hits: continue
        if cls not in s and not g.endswith('.spec.ts'): continue
        (spec if g.endswith('.spec.ts') else other).append((g, len(hits)))
    # subclasses writing this.name
    sub = [g for g in ts if g != f and re.search(r'extends\s+' + re.escape(cls) + r'\b', read(g)) and re.search(r'\bthis\.' + re.escape(name) + r'\s*=(?!=)', read(g))]
    kind = 'own' if own else 'subclass' if sub else 'other-code' if other else 'spec-only' if spec else 'unfound'
    out.append((kind, f, cls, name, len(own), [g for g, _ in spec], [g for g, _ in other], sub))

c = collections.Counter(o[0] for o in out)
print(dict(c))
for kind in ['spec-only', 'own', 'subclass', 'other-code', 'unfound']:
    print('\n==', kind)
    for k, f, cls, name, n, spec, other, sub in out:
        if k != kind: continue
        extra = ''
        if kind == 'spec-only': extra = ' <- ' + ', '.join(os.path.basename(s) for s in spec)
        if kind == 'own': extra = f' ({n} writes in the class)'
        if kind == 'subclass': extra = ' <- ' + ', '.join(os.path.basename(s) for s in sub)
        if kind == 'other-code': extra = ' <- ' + ', '.join(os.path.basename(s) for s in other)
        print(f'   {cls}.{name}  [{f.split("/src/")[0].replace("libs/", "")}]{extra}')
