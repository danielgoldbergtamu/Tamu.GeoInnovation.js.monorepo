# #1657: in specs that have a fixture, set a component's inputs the supported way,
#   component.title = 'x';   ->   fixture.componentRef.setInput('title', 'x');
# so the inputs themselves can become signal inputs. Usage: python specs-set-input.py <repo>
import os, re, sys
os.chdir(sys.argv[1])
L = 'libs/'
JOBS = [  # spec file, input names
    ('aggiemap/ngx/discover/src/lib/components/map-columns/map-columns.thumbnail.spec.ts', ['columns']),
    ('aggiemap/ngx/discover/src/lib/components/maps-page-header/maps-page-header.component.spec.ts', ['title']),
    ('aggiemap/ngx/ui/shared/src/lib/modules/transportation/components/bus-timetable/bus-timetable.component.spec.ts', ['route']),
    ('geoservices/ngx/src/lib/core/modules/interactive/components/common/interactive-mode-toggle/interactive-mode-toggle.component.spec.ts', ['mode']),
    ('maps/feature/legend/src/lib/components/legend-collection/legend-collection.component.spec.ts', ['group', 'allowVisibilityToggle']),
    ('maps/feature/legend/src/lib/components/legend-element/legend-element.component.spec.ts', ['element', 'layer', 'groupTitle']),
    ('ui-kits/ngx/forms/src/lib/components/checkbox-group/checkbox-group.component.spec.ts', ['referenceId']),
    ('ui-kits/ngx/forms/src/lib/components/date-time-picker/date-time-picker.component.spec.ts', ['minView']),
    ('ui-kits/ngx/forms/src/lib/components/radio-group/radio-group.component.spec.ts', ['valuePath']),
    ('ui-kits/ngx/navigation/mobile-tab/src/lib/components/tab/tab.component.spec.ts', ['route']),
    ('ui-kits/ngx/navigation/mobile-tile/src/lib/components/tile-navigation/tile-navigation.component.spec.ts', ['toggle']),
]


def statement_end(s, i):
    """Index of the `;` that ends the statement whose value starts at s[i]."""
    depth, quote = 0, None
    j = i
    while j < len(s):
        ch = s[j]
        if quote:
            if ch == '\\': j += 2; continue
            if ch == quote: quote = None
        elif ch in '\'"`': quote = ch
        elif ch in '([{': depth += 1
        elif ch in ')]}': depth -= 1
        elif ch == ';' and depth == 0: return j
        j += 1
    raise ValueError('no end of statement')


total = 0
for rel, names in JOBS:
    f = L + rel
    s = open(f, encoding='utf-8', newline='').read()
    fixture = (re.search(r'\b(\w*[Ff]ixture\w*)\s*=\s*TestBed\.createComponent', s) or re.search(r'\blet (\w*[Ff]ixture\w*)\b', s))
    assert fixture, f
    fx = fixture.group(1)
    n = 0
    for name in names:
        pat = re.compile(r'\b(?:' + re.escape(fx) + r'\.componentInstance|component)\.' + re.escape(name) + r'\s*=(?!=)\s*')
        while True:
            m = pat.search(s)
            if not m: break
            end = statement_end(s, m.end())
            value = s[m.end():end]
            s = s[:m.start()] + f"{fx}.componentRef.setInput('{name}', {value})" + s[end:]
            n += 1
    assert n, (f, names)
    open(f, 'w', encoding='utf-8', newline='').write(s)
    total += n
    print(n, rel.split('/')[-1], names)
print('writes replaced:', total)
