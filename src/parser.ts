import * as path from "path";
import { Parser, Language } from "web-tree-sitter";

let parserPromise: Promise<Parser> | undefined;
let languagePromise: Promise<Language> | undefined;

export async function getParser(extensionPath: string): Promise<Parser> {
  if (!parserPromise) {
    parserPromise = (async () => {
      await Parser.init({
        // Shipped into resources/ at build time (scripts/build-wasm.sh) so the
        // bundled .vsix does not need node_modules at runtime.
        locateFile: () =>
          path.join(extensionPath, "resources", "web-tree-sitter.wasm"),
      });
      return new Parser();
    })();
  }
  if (!languagePromise) {
    // Wait for Parser.init to set up the WebAssembly loader before Language.load uses it.
    languagePromise = parserPromise.then(() =>
      Language.load(path.join(extensionPath, "resources", "tree-sitter-violet.wasm"))
    );
  }
  const [parser, language] = await Promise.all([parserPromise, languagePromise]);
  if (parser.language !== language) {
    parser.setLanguage(language);
  }
  return parser;
}
