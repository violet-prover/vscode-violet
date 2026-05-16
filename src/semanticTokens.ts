import * as vscode from "vscode";
import { Node } from "web-tree-sitter";
import { getParser } from "./parser";

export const legend = new vscode.SemanticTokensLegend(
  ["keyword", "operator", "comment", "string", "number", "function", "type", "namespace", "variable"],
  []
);

const typeIndex: Record<string, number> = Object.fromEntries(
  legend.tokenTypes.map((t, i) => [t, i])
);

export class VioletSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  private trees = new Map<string, import("web-tree-sitter").Tree>();

  constructor(private readonly extensionPath: string) {}

  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const parser = await getParser(this.extensionPath);
    const key = document.uri.toString();
    const previous = this.trees.get(key);
    const tree = parser.parse(document.getText(), previous);
    if (!tree) {
      return new vscode.SemanticTokensBuilder(legend).build();
    }
    this.trees.set(key, tree);

    const builder = new vscode.SemanticTokensBuilder(legend);
    walk(tree.rootNode, builder);
    return builder.build();
  }
}

function walk(node: Node, builder: vscode.SemanticTokensBuilder): void {
  const tokenType = classify(node);
  if (tokenType !== undefined && node.startPosition.row === node.endPosition.row) {
    const length = node.endPosition.column - node.startPosition.column;
    builder.push(node.startPosition.row, node.startPosition.column, length, typeIndex[tokenType], 0);
    return;
  }
  for (const child of node.namedChildren) walk(child, builder);
}

function classify(node: Node): string | undefined {
  switch (node.type) {
    case "comment":
      return "comment";
    case "symbol":
    case "universe_join":
      return "operator";
  }

  // Heads of declarations.
  // Important: tree-sitter-violet uses *_decl names, NOT *_declaration.
  // Use field names where possible — let_decl, data_decl, record_decl all have a `name` field.
  if (node.type === "identifier") {
    const parent = node.parent;
    if (parent) {
      const nameField = parent.childForFieldName("name");
      if (nameField && nameField.equals(node)) {
        if (parent.type === "let_decl") return "function";
        if (parent.type === "data_decl" || parent.type === "record_decl") return "type";
      }
      // import_decl has a `path: qualified_name` whose children are identifiers.
      if (parent.type === "qualified_name" && parent.parent?.type === "import_decl") {
        return "namespace";
      }
    }
  }
  return undefined;
}
