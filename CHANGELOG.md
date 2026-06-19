# Changelog

## [Unreleased]

## [0.4.0]

- More unicode input for notation glyphs
- Highlight `\with` and `\axiom` keywords; `\axiom` names now highlight as definitions, and both have `\`-picker snippets
- Keyword snippets in the `\` picker: type a keyword (`let`, `data`, `record`, …) to insert a Violet construct that expands with interactive tab stops
  - User-defined snippets via `violet.snippetInput.userSnippets` setting
  - Insert command renamed to **Violet: Insert Symbol or Snippet**
- Unicode input: `triangleleft` (◁) and `triangleright` (▷) symbols
- Fix TextMate grammar identifier patterns to support Unicode characters (Greek letters, mathematical symbols, etc.)

## [0.3.0]

- LSP client
- Unicode input picker (`\` keybinding)
  - Built-in symbol table (Greek letters, arrows, logical operators, set notation, etc.)
  - User-defined symbols via `violet.unicodeInput.userSymbols` setting
  - Recently used symbols pinned at top of picker
  - Double-backslash (`\\`) inserts a literal backslash

## [0.2.0]

- CI pipeline to upload `.vsix` to GitHub artifacts

## [0.1.0]

- Initial release
- Syntax highlighting for the Violet language
