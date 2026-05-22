import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import {
  __setPickerForTesting,
  __clearPickerForTesting,
} from "../src/unicodeInput";
import { Symbol } from "../src/unicodeSymbols";

suite("unicode input command", () => {
  suiteSetup(async () => {
    const ext = vscode.extensions.getExtension("dannypsnl.vscode-violet")!;
    await ext.activate();
  });

  teardown(() => {
    __clearPickerForTesting();
  });

  test("registers violet.insertUnicode", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("violet.insertUnicode"));
  });

  test("inserts the chosen glyph at the cursor", async () => {
    const fixture = path.resolve(__dirname, "../../test/fixtures/hello.vt");
    const doc = await vscode.workspace.openTextDocument(fixture);
    const editor = await vscode.window.showTextDocument(doc);
    const before = doc.getText();

    const chosen: Symbol = { name: "pi", glyph: "π" };
    __setPickerForTesting(async () => chosen);

    await vscode.commands.executeCommand("violet.insertUnicode");

    const after = doc.getText();
    assert.notStrictEqual(after, before);
    assert.ok(after.includes("π"), `expected π in document, got: ${JSON.stringify(after)}`);

    await vscode.commands.executeCommand("undo");
    void editor;
  });

  test("inserts nothing when picker is dismissed", async () => {
    const fixture = path.resolve(__dirname, "../../test/fixtures/hello.vt");
    const doc = await vscode.workspace.openTextDocument(fixture);
    await vscode.window.showTextDocument(doc);
    const before = doc.getText();

    __setPickerForTesting(async () => undefined);
    await vscode.commands.executeCommand("violet.insertUnicode");

    assert.strictEqual(doc.getText(), before);
  });
});
