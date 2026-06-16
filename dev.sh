#!/usr/bin/env bash
# The system Homebrew Node (19.1.0) is broken (icu4c version mismatch), so this project
# uses the self-contained Node in .toolchain/. This wrapper puts it first on PATH and
# forwards to npm — e.g. `./dev.sh` (dev server), `./dev.sh build`, `./dev.sh test`.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$DIR/.toolchain/node-v22.14.0-darwin-arm64/bin:$PATH"
exec npm run "${1:-dev}"
