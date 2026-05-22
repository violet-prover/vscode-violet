# vscode-violet

VSCode extension providing syntax highlighting for the Violet dependently-typed language.

## Features

- File association for `.vt`
- TextMate grammar (keywords, comments, operators, strings, numbers)
- Semantic tokens via the sibling [tree-sitter-violet](https://github.com/violet-prover/tree-sitter-violet) grammar — distinguishes `let`-defined names, `data`/`record` types, imported namespaces, and user-defined operator tokens
- File icon for `.vt`
- Unicode input picker — press `\` in a `.vt` file to open a searchable picker showing each symbol (Π, Σ, λ, ∀, →, …) before you commit. Recently used symbols appear at the top. Type `\\` to insert a literal backslash.

## Unicode input

Press `\` while editing a `.vt` file to open the unicode picker. Type a name (`Pi`, `forall`, `to`, `lambda`, …) or an alias to filter. Enter inserts the symbol at every cursor. Recently used symbols are pinned at the top.

To type a literal backslash, press `\` twice: the first opens the picker, the second dismisses it and inserts a `\`.

Add your own mappings in settings:

```jsonc
"violet.unicodeInput.userSymbols": [
  { "name": "myop", "glyph": "⊕", "aliases": ["circplus"] }
]
```

A font with broad unicode coverage (e.g. JuliaMono, Fira Code, JetBrains Mono with Symbols Nerd Font) is recommended.

## Requirements

- VSCode >= 1.85
- For semantic tokens: nothing extra — the WASM grammar is bundled in the `.vsix`

## Building from source

`vscode-violet`'s build script reads the grammar from `../tree-sitter-violet`.

```sh
npm install
npm run build:wasm    # requires emscripten or docker (used by tree-sitter-cli)
npm run compile
npm run package       # produces vscode-violet-<version>.vsix
```

## Local install

```sh
code --install-extension vscode-violet-<version>.vsix
```

## Development

Open `vscode-violet/` in VSCode and press **F5** to launch the Extension Development Host with the extension loaded.

Tests:
```sh
npm run test:grammar   # TextMate scope assertions
npm test               # semantic tokens smoke test (electron test runner)
```
