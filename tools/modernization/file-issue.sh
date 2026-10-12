#!/usr/bin/env bash
# file-issue.sh <title> <body file> <label> <type: Task|Bug|Feature> <priority: High|Medium|Low> <projects: "2 3"> [parent issue number]
# Files an issue with every field set, status Todo, and prints its number.
set -euo pipefail
R=TamuGeoInnovation/Tamu.GeoInnovation.js.monorepo
title=$1; body=$2; label=$3; type=$4; prio=$5; projects=$6; parent=${7:-}
case $type in Task) T=IT_kwDOAC0_c84ABH0H;; Bug) T=IT_kwDOAC0_c84ABH0J;; Feature) T=IT_kwDOAC0_c84ABH0M;; esac
case $prio in High) P=IFSSO_kgDOAAwdRw;; Medium) P=IFSSO_kgDOAAwdSA;; Low) P=IFSSO_kgDOAAwdSQ;; esac
url=$(gh issue create --repo $R --title "$title" --body-file "$body" --label "$label" --assignee danielgoldbergtamu)
n=${url##*/}
id=$(gh issue view "$n" --repo $R --json id --jq .id)
gh api graphql -f query='mutation($i:ID!,$t:ID!){updateIssue(input:{id:$i,issueTypeId:$t}){issue{number}}}' -f i="$id" -f t=$T >/dev/null
gh api graphql -f query='mutation($i:ID!,$f:ID!,$o:ID!){setIssueFieldValue(input:{issueId:$i,issueFields:[{fieldId:$f,singleSelectOptionId:$o}]}){clientMutationId}}' -f i="$id" -f f=IFSS_kgDOAAb4TA -f o=$P >/dev/null
for p in $projects; do
  item=$(gh project item-add "$p" --owner TamuGeoInnovation --url "$url" --format json --jq .id)
  if [ "$p" = 2 ]; then pid=PVT_kwDOAC0_c84ABSmH; fid=PVTSSF_lADOAC0_c84ABSmHzgAwPnk; else pid=PVT_kwDOAC0_c84ABTG-; fid=PVTSSF_lADOAC0_c84ABTG-zgAwiwM; fi
  gh project item-edit --id "$item" --project-id $pid --field-id $fid --single-select-option-id "${STATUS:-f75ad846}" >/dev/null
done
if [ -n "$parent" ]; then
  pidn=$(gh issue view "$parent" --repo $R --json id --jq .id)
  gh api graphql -f query='mutation($p:ID!,$c:ID!){addSubIssue(input:{issueId:$p,subIssueId:$c}){issue{number}}}' -f p="$pidn" -f c="$id" >/dev/null
fi
echo "$n"
