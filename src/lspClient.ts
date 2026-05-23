import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export async function startLanguageClient(
  context: vscode.ExtensionContext
): Promise<void> {
  const config = vscode.workspace.getConfiguration("violet");
  if (config.get<boolean>("lsp.enable", true) === false) {
    return;
  }

  const command = config.get<string>("serverPath", "violet");
  const args = config.get<string[]>("serverArgs", ["lsp"]);

  const serverOptions: ServerOptions = {
    command,
    args,
    transport: TransportKind.stdio,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "violet" }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher("**/*.vt"),
    },
  };

  client = new LanguageClient(
    "violet",
    "Violet Language Server",
    serverOptions,
    clientOptions
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("violet.restartServer", async () => {
      if (client) {
        await client.restart();
      }
    })
  );

  try {
    await client.start();
  } catch (err) {
    vscode.window.showErrorMessage(
      `Violet LSP failed to start. Check \`violet.serverPath\` (currently \`${command}\`). Error: ${err}`
    );
  }
}

export async function stopLanguageClient(): Promise<void> {
  if (!client) {
    return;
  }
  await client.stop();
  client = undefined;
}
