import * as vscode from "vscode";

export function registerUnicodeInput(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("violet.insertUnicode", async () => {
      // Implemented in later tasks.
    })
  );
}
