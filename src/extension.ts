import * as vscode from "vscode";
import { legend, VioletSemanticTokensProvider } from "./semanticTokens";
import { registerUnicodeInput } from "./unicodeInput";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new VioletSemanticTokensProvider(context.extensionPath);
  context.subscriptions.push(
    vscode.languages.registerDocumentSemanticTokensProvider(
      { language: "violet" },
      provider,
      legend
    )
  );
  registerUnicodeInput(context);
}

export function deactivate(): void {}
