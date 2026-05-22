import * as assert from "assert";
import * as vscode from "vscode";

suite("unicode input command", () => {
  test("registers violet.insertUnicode", async () => {
    const ext = vscode.extensions.getExtension("dannypsnl.vscode-violet")!;
    await ext.activate();
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("violet.insertUnicode"),
      "violet.insertUnicode should be registered"
    );
  });
});
