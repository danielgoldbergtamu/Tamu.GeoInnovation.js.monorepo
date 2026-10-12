#!/bin/sh
# Runs one Angular signal migration inside a check volume's clone (/w) and writes the result as a patch.
#   MIGRATION  the schematic, e.g. signal-input-migration
#   OPTS       its options
#   LIBS       "yes" to add a temporary target to each library with no build target (second pass)
set -u
git config --global --add safe.directory '*'
cd /w
git checkout -q -- . && git clean -fdq -- libs apps
[ -f /logs/$MIGRATION.in.patch ] && git apply /logs/$MIGRATION.in.patch && echo "applied the earlier pass"
# Projects the migration must not spend time on, or touch: removed from this clone only.
for p in apps/*-nest apps/oidc-* apps/signage-* libs/oidc libs/signage; do
  [ -d "$p" ] && find "$p" -name project.json -delete
done
if [ "${LIBS:-no}" = yes ]; then
  node -e "
    const fs=require('fs'), path=require('path'), cp=require('child_process');
    const want=fs.readFileSync('/logs/$MIGRATION.libs','utf8').split('\n').filter(Boolean);
    let n=0;
    for (const dir of want) {
      const p=dir+'/project.json', tsc=dir+'/tsconfig.lib.json';
      if (!fs.existsSync(p) || !fs.existsSync(tsc)) continue;
      const j=JSON.parse(fs.readFileSync(p)); j.targets=j.targets||{};
      j.targets['tmp-signals']={executor:'nx:noop',options:{tsConfig:tsc}};
      fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n'); n++;
    }
    console.log('temporary targets added:', n);"
fi
echo "=== $MIGRATION $(date +%T)"
node node_modules/nx/dist/bin/nx.js g @angular/core:$MIGRATION --path=./ $OPTS --no-interactive > /logs/$MIGRATION.log 2>&1
echo "exit=$? updates=$(grep -cE '^UPDATE' /logs/$MIGRATION.log)"
grep -vE "^UPDATE|^$|Preparing analysis|Scanning for" /logs/$MIGRATION.log | tail -30
git diff --binary -- libs apps ':(exclude)**/project.json' > /logs/$MIGRATION.patch
git diff --stat -- libs apps ':(exclude)**/project.json' | tail -1
echo "=== DONE $(date +%T)"
