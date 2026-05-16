import * as path from "path";
import { Parser, Language } from "web-tree-sitter";

let parserPromise: Promise<Parser> | undefined;
let languagePromise: Promise<Language> | undefined;

export async function getParser(extensionPath: string): Promise<Parser> {
  if (!parserPromise) {
    parserPromise = (async () => {
      await Parser.init({
        locateFile: () =>
          path.join(extensionPath, "node_modules", "web-tree-sitter", "web-tree-sitter.wasm"),
      });
      return new Parser();
    })();
  }
  if (!languagePromise) {
    languagePromise = (async () => {
      const wasmPath = path.join(extensionPath, "resources", "tree-sitter-violet.wasm");
      return Language.load(wasmPath);
    })();
  }
  const [parser, language] = await Promise.all([parserPromise, languagePromise]);
  if (parser.language !== language) {
    parser.setLanguage(language);
  }
  return parser;
}
