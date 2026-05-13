#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SERVER="$ROOT/mcp/forge-team-server/dist/hook-runner.js"
if [ ! -f "$SERVER" ]; then
  echo "adoaler-forge-team-os: MCP server is not built; skipping pre-edit guard" >&2
  exit 0
fi
node "$SERVER" "pre-edit"
