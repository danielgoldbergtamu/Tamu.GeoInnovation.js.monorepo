# Count the proposed quick set against a full local smoke log (list reporter), with each group's summed test time.
#   python quick-set-count.py <smoke log> [workers]
import re, sys, collections
log = sys.argv[1]
workers = int(sys.argv[2]) if len(sys.argv) > 2 else 6
tests = {}
for line in open(log, encoding='utf-8', errors='replace'):
    m = re.match(r'\s+(✓|ok|✘|x|-)\s+\d+ \[chromium\] › test/smoke/aggiemap/([\w-]+\.spec\.ts):\d+:\d+ › (.*?)(?: \((\d+(?:\.\d+)?)(ms|s|m)\))?\s*$', line)
    if not m:
        continue
    mark, spec, title, n, unit = m.groups()
    secs = 0.0 if n is None else float(n) * {'ms': 0.001, 's': 1, 'm': 60}[unit]
    title = re.sub(r' \(retry #\d\)$', '', title)
    key = (spec, title)
    tests[key] = max(tests.get(key, 0.0), secs)

CHANGED = re.compile(r'ring-day|move-out|t-camp')
SAMPLE = re.compile(r'/parking/ts-main-parking|/events/gameday-parking')
MAIN = re.compile(r'(^|[ `(])/map([ :/?]|$)|the main map')
WHOLE_CHANGED = {'services.spec.ts': 'GIS and basemap services (HTTP only)', 'basemap-zoom.spec.ts': 'Basemap at the deepest zoom',
                 'campus-basemap.spec.ts': 'Satellite campus basemaps', 'popup.spec.ts': 'Popups, every map that has one',
                 'development-only.spec.ts': 'Development-only features'}
WHOLE_CORE = {'build-banner.spec.ts', 'esri-runtime.spec.ts', 'analytics.spec.ts', 'gis-hosts.spec.ts', 'retired.spec.ts', 'paint.spec.ts'}

groups = collections.OrderedDict()
def add(g, secs):
    c, t = groups.get(g, (0, 0.0)); groups[g] = (c + 1, t + secs)

per_spec_all = collections.Counter()
for (spec, title), secs in tests.items():
    per_spec_all[spec] += 1
    if spec in WHOLE_CHANGED: add('1 ' + WHOLE_CHANGED[spec], secs)
    elif spec in WHOLE_CORE: add('2 Build guards (banner, runtime, analytics, hosts, retired, paint)', secs)
    elif spec == 'mobile.spec.ts': add('2 Phone width, one page of each kind', secs)
    elif 'lists at least' in title: add('2 Coverage floor', secs)
    elif CHANGED.search(title): add(f'1 Changed event maps (ring-day, move-out, t-camp): {spec}', secs)
    elif MAIN.search(title): add(f'1 Main map: {spec}', secs)
    elif SAMPLE.search(title): add(f'2 One untouched parking and one event map: {spec}', secs)

tc = tt = 0
for g, (c, t) in sorted(groups.items()):
    print(f'{g} | {c} | {t/60:.1f} min of test time')
    tc += c; tt += t
print(f'TOTAL | {tc} tests | {tt/60:.1f} min of test time | about {tt/60/workers:.1f} min on {workers} workers, plus start-up')
print('whole log:', len(tests), 'tests,', f'{sum(tests.values())/60:.0f} min of test time')
print('per spec in the whole log:', dict(per_spec_all.most_common()))
