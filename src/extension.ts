import * as vscode from "vscode";
import { legend, VioletSemanticTokensProvider } from "./semanticTokens";
import {
  registerUnicodeInput,
  __setPickerForTesting,
  __clearPickerForTesting,
  LiteralBackslash,
} from "./unicodeInput";
import { startLanguageClient, stopLanguageClient } from "./lspClient";

// Public API returned from activate(). Integration tests reach the *running*
// (bundled) extension instance through `ext.exports`; importing these hooks
// from "../src" would touch a separate module copy whose state the registered
// commands never see.
export interface VioletApi {
  __setPickerForTesting: typeof __setPickerForTesting;
  __clearPickerForTesting: typeof __clearPickerForTesting;
  LiteralBackslash: typeof LiteralBackslash;
}

export function activate(context: vscode.ExtensionContext): VioletApi {
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
  return { __setPickerForTesting, __clearPickerForTesting, LiteralBackslash };
}

export function deactivate(): Thenable<void> | undefined {
  return stopLanguageClient();
}
