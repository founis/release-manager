#!/bin/bash
# usage: WP_API_* env set; runphp.sh <file.php> <out.full>
# The PHP file has no <?php tag; it is sent as the "code" param of novamira/execute-php.
D=$(dirname "$0")
P=$(python3 -I -c 'import json,sys;print(json.dumps({"code":open(sys.argv[1],encoding="utf-8").read()}))' "$1")
cd "$D" && OUT="$2" node ability.js run novamira/execute-php "$P" > /dev/null; python3 -I -c '
import json,sys
t=open(sys.argv[1],encoding="utf-8").read()
try:
  o=json.loads(t); r=o.get("result",o) if isinstance(o,dict) else o
  print(json.dumps(r,ensure_ascii=False,indent=1)[:int(sys.argv[2])])
except Exception: print(t[:int(sys.argv[2])])' "$2" "${LIM:-6000}"
