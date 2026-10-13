# Print the latest releases of every release definition named like AggieMap, across the organisation's projects.
# The token comes from the AZ_PAT environment variable and is never printed.
import base64, json, os, urllib.parse, urllib.request
ORG = 'tamugeoinnovation'
auth = 'Basic ' + base64.b64encode((':' + os.environ['AZ_PAT']).encode()).decode()


def get(url):
    req = urllib.request.Request(url, headers={'Authorization': auth})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


for p in get(f'https://dev.azure.com/{ORG}/_apis/projects?api-version=7.0')['value']:
    proj = urllib.parse.quote(p['name'])
    try:
        defs = get(f'https://vsrm.dev.azure.com/{ORG}/{proj}/_apis/release/definitions?api-version=7.0')['value']
    except Exception as e:
        print('a project: definitions not readable:', type(e).__name__)
        continue
    for d in defs:
        if 'aggiemap' not in d['name'].lower().replace(' ', ''):
            continue
        rs = get(f'https://vsrm.dev.azure.com/{ORG}/{proj}/_apis/release/releases?definitionId={d["id"]}&$top=4&$expand=environments,artifacts&api-version=7.0')['value']
        for r in rs:
            arts = r.get('artifacts') or [{}]
            ref = arts[0].get('definitionReference', {})
            envs = '; '.join(f"{e['name']}: {e['status']}" for e in r.get('environments', []))
            print(d['name'], d['id'], '|', r['name'], r['createdOn'][:19] + 'Z', '| build', ref.get('version', {}).get('name'),
                  (ref.get('sourceVersion', {}) or {}).get('id', '')[:9], '|', envs)

# Detail for the newest AggieMap release's stages: approvals and deploy steps.
if os.environ.get('AZ_DETAIL'):
    for p in get(f'https://dev.azure.com/{ORG}/_apis/projects?api-version=7.0')['value']:
        proj = urllib.parse.quote(p['name'])
        try:
            rs = get(f'https://vsrm.dev.azure.com/{ORG}/{proj}/_apis/release/releases?definitionId=13&$top=1&$expand=environments,approvals&api-version=7.0')['value']
        except Exception:
            continue
        for r in rs:
            if r['releaseDefinition']['name'] != 'AggieMap':
                continue
            for e in r['environments']:
                print(r['name'], '|', e['name'], '|', e['status'], '| pre-approvals:',
                      [(a.get('status'), a.get('isAutomated')) for a in e.get('preDeployApprovals', [])],
                      '| steps:', [(s.get('status'), s.get('operationStatus'), (s.get('queuedOn') or '')[:19]) for s in e.get('deploySteps', [])])
