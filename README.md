# vscode-violet

VSCode extension providing syntax highlighting for the Violet dependently-typed language.

## Features

- File association for `.vt`
- TextMate grammar (keywords, comments, operators, strings, numbers)
- Semantic tokens via the sibling [tree-sitter-violet](https://github.com/violet-prover/tree-sitter-violet) grammar — distinguishes `let`-defined names, `data`/`record` types, imported namespaces, and user-defined operator tokens
- File icon for `.vt`

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
