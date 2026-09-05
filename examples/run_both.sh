#!/usr/bin/env bash
#
# The same program under SAP's node-rfc and under erpl-node-rfc, diffed.
#
# It compares *behaviour*, never source, which is what keeps this clean-room --
# and it is the technique that found two real bugs for the Python binding and
# settled UTCLONG for the Go one.
#
#   SAPNWRFC_HOME=/opt/nwrfcsdk SAP_USER=DEVELOPER SAP_PASSWD=... \
#     bindings/node-rfc/examples/run_both.sh
#
set -euo pipefail

# Hard-required: without the SDK the reference cannot be installed, and the
# script would quietly compare erpl-node-rfc against itself and always report
# no differences.
: "${SAPNWRFC_HOME:?set it to the unpacked SAP NW RFC SDK, e.g. /opt/nwrfcsdk}"
: "${SAP_USER:?}"
: "${SAP_PASSWD:?}"

HERE="$(cd "$(dirname "$0")" && pwd)"
BINDING="$(cd "$HERE/.." && pwd)"
WORK="${WORK:-${TMPDIR:-/tmp}/node-rfc-side-by-side}"
mkdir -p "$WORK/sap" "$WORK/erpl"

echo "== installing SAP node-rfc (SAPNWRFC_HOME=$SAPNWRFC_HOME)"
if [ ! -d "$WORK/sap/node_modules/node-rfc" ]; then
  ( cd "$WORK/sap" && npm init -y >/dev/null && npm install node-rfc@3.3.1 >/dev/null )
fi

echo "== linking erpl-node-rfc ($BINDING)"
if [ ! -e "$WORK/erpl/node_modules/erpl-node-rfc" ]; then
  ( cd "$WORK/erpl" && npm init -y >/dev/null && mkdir -p node_modules \
      && ln -sfn "$BINDING" node_modules/erpl-node-rfc )
fi

cp "$HERE/same_program.js" "$WORK/sap/program.js"
cp "$HERE/same_program.js" "$WORK/erpl/program.js"

echo "== running"
( cd "$WORK/sap" && RFC_PACKAGE=node-rfc LD_LIBRARY_PATH="$SAPNWRFC_HOME/lib" \
    node program.js ) > "$WORK/sap.txt" 2>&1 || true
# The asymmetry is the point: this side needs no library path at all.
( cd "$WORK/erpl" && env -u LD_LIBRARY_PATH RFC_PACKAGE=erpl-node-rfc \
    node program.js ) > "$WORK/erpl.txt" 2>&1 || true

if diff -u "$WORK/sap.txt" "$WORK/erpl.txt" > "$WORK/diff.txt"; then
  printf '\n\033[1mno differences across %s lines\033[0m\n' "$(wc -l < "$WORK/sap.txt")"
else
  echo
  cat "$WORK/diff.txt"
  echo
  echo "outputs: $WORK/sap.txt $WORK/erpl.txt"
  exit 1
fi
