# For the components the scan clears under <prefix>, list any that write a field outside ngOnInit/constructor.
import os, re, sys
os.chdir(sys.argv[1])
src = open(r'C:\TAMU\logs\onpush-scan.py', encoding='utf-8').read()
sys.argv = ['x', sys.argv[1], sys.argv[2]]
g = {}
exec(src.split("for k, v in groups.items():")[0], g)
n = 0
for f in g['groups']['clean']:
    s = open(f, encoding='utf-8').read()
    i = s.find('export class')
    if i < 0: i = s.find('class ')
    body = s[i:]
    writes = sorted(set(re.findall(r'this\.(\w+)\s*(?:=[^=]|\+\+|--)', body)))
    init = ' '.join(m.group(2) for m in re.finditer(r'(ngOnInit|constructor)\(\)[^{]*\{(.*?)\n  \}', body, re.S))
    outside = [w for w in writes if not re.search(r'this\.' + w + r'\s*=', init)]
    if outside:
        n += 1
        print('READ', f.split('/src/lib/')[-1], '| writes outside init:', ', '.join(outside))
print('clean:', len(g['groups']['clean']), ' to read:', n)
