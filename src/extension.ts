import * as vscode from "vscode";
import { legend, VioletSemanticTokensProvider } from "./semanticTokens";
import { registerUnicodeInput } from "./unicodeInput";
import { startLanguageClient, stopLanguageClient } from "./lspClient";

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
  void startLanguageClient(context);
}

export function deactivate(): Thenable<void> | undefined {
  return stopLanguageClient();
}
