#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GRAMMAR_DIR="$(cd "$EXT_ROOT/../tree-sitter-violet" && pwd)"

cd "$GRAMMAR_DIR"

npx tree-sitter generate
npx tree-sitter build --wasm

mkdir -p "$EXT_ROOT/resources"
cp tree-sitter-violet.wasm "$EXT_ROOT/resources/"
echo "WASM built and copied to $EXT_ROOT/resources/tree-sitter-violet.wasm"
