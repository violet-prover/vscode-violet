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

# Ship the web-tree-sitter runtime wasm next to the grammar so the bundled
# extension can locate it without node_modules (see src/parser.ts).
cp "$EXT_ROOT/node_modules/web-tree-sitter/web-tree-sitter.wasm" "$EXT_ROOT/resources/"
echo "Copied web-tree-sitter.wasm to $EXT_ROOT/resources/web-tree-sitter.wasm"
