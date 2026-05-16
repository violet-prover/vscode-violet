import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";

suite("semantic tokens", () => {
  test("emits at least one token for a basic .vt file", async () => {
    // __dirname at runtime = out/test (the test file is NOT inside suite/)
    // so ../../test/fixtures/hello.vt = project root / test/fixtures/hello.vt
    const fixture = path.resolve(__dirname, "../../test/fixtures/hello.vt");
    const doc = await vscode.workspace.openTextDocument(fixture);
    await vscode.window.showTextDocument(doc);

    const ext = vscode.extensions.getExtension("dannypsnl.vscode-violet")!;
    await ext.activate();

    const tokens = (await vscode.commands.executeCommand(
      "vscode.provideDocumentSemanticTokens",
      doc.uri
    )) as vscode.SemanticTokens | undefined;

    assert.ok(tokens, "expected semantic tokens result");
    assert.ok(tokens!.data.length > 0, "expected non-empty token data");
    assert.strictEqual(tokens!.data.length % 5, 0);
  });
});
