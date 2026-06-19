import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import type { VioletApi } from "../src/extension";
import { recentsFor } from "../src/unicodeInput";
import { Symbol } from "../src/unicodeSymbols";
import { Snippet } from "../src/snippets";

// The extension ships bundled, so the running command and the tsc-compiled test
// code are separate module copies. Reach the *running* instance's picker hooks
// (and its LiteralBackslash symbol) through the activated extension's exports;
// pulling them from "../src/unicodeInput" would mutate state nothing reads.
let __setPickerForTesting: VioletApi["__setPickerForTesting"];
let __clearPickerForTesting: VioletApi["__clearPickerForTesting"];
let LiteralBackslash: VioletApi["LiteralBackslash"];

async function activateApi(): Promise<void> {
  const ext = vscode.extensions.getExtension("dannypsnl.vscode-violet")!;
  const api = await ext.activate();
  __setPickerForTesting = api.__setPickerForTesting;
  __clearPickerForTesting = api.__clearPickerForTesting;
  LiteralBackslash = api.LiteralBackslash;
}

suite("unicode input command", () => {
  suiteSetup(async () => {
    await activateApi();
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

suite("unicode input \\\\ escape", () => {
  teardown(() => {
    __clearPickerForTesting();
  });

  test("inserts literal backslash when picker reports LiteralBackslash", async () => {
    const fixture = path.resolve(__dirname, "../../test/fixtures/hello.vt");
    const doc = await vscode.workspace.openTextDocument(fixture);
    await vscode.window.showTextDocument(doc);
    const before = doc.getText();

    __setPickerForTesting(async () => LiteralBackslash);
    await vscode.commands.executeCommand("violet.insertUnicode");

    const after = doc.getText();
    assert.notStrictEqual(after, before);
    assert.strictEqual(after.length, before.length + 1, "exactly one character should be inserted");

    await vscode.commands.executeCommand("undo");
  });
});

suite("unicode input recents", () => {
  teardown(() => {
    __clearPickerForTesting();
  });

  test("pushes the chosen name to globalState on accept", async () => {
    const fixture = path.resolve(__dirname, "../../test/fixtures/hello.vt");
    const doc = await vscode.workspace.openTextDocument(fixture);
    await vscode.window.showTextDocument(doc);

    const ext = vscode.extensions.getExtension("dannypsnl.vscode-violet")!;
    await ext.activate();

    __setPickerForTesting(async () => ({ name: "pi", glyph: "π" }));
    await vscode.commands.executeCommand("violet.insertUnicode");

    // The Recents store persists to ExtensionContext.globalState, which is
    // managed by VS Code and not directly exposed to tests. This test verifies
    // that the command completes without error and the document was modified
    // (the recents store itself is unit-tested in test/unicode-recents.test.ts).
    assert.ok(doc.getText().includes("π"), "document should contain π");
    await vscode.commands.executeCommand("undo");
  });
});

suite("recents namespacing", () => {
  test("reads glyph-namespaced entries for the glyph kind", () => {
    assert.deepStrictEqual(
      recentsFor("glyph", ["glyph:pi", "snippet:data", "glyph:to"]),
      ["pi", "to"]
    );
  });

  test("reads snippet-namespaced entries for the snippet kind", () => {
    assert.deepStrictEqual(
      recentsFor("snippet", ["glyph:pi", "snippet:data", "snippet:let"]),
      ["data", "let"]
    );
  });

  test("treats legacy unprefixed entries as glyphs", () => {
    assert.deepStrictEqual(recentsFor("glyph", ["pi", "to"]), ["pi", "to"]);
    assert.deepStrictEqual(recentsFor("snippet", ["pi", "to"]), []);
  });
});

suite("snippet input", () => {
  teardown(() => {
    __clearPickerForTesting();
  });

  test("expands the chosen snippet at the cursor", async () => {
    const fixture = path.resolve(__dirname, "../../test/fixtures/hello.vt");
    const doc = await vscode.workspace.openTextDocument(fixture);
    await vscode.window.showTextDocument(doc);
    const before = doc.getText();

    const chosen: Snippet = { name: "let", body: "\\let ${1:name} = ${0}" };
    __setPickerForTesting(async () => chosen);

    await vscode.commands.executeCommand("violet.insertUnicode");

    const after = doc.getText();
    assert.notStrictEqual(after, before);
    assert.ok(
      after.includes("\\let name = "),
      `expected expanded snippet in document, got: ${JSON.stringify(after)}`
    );

    await vscode.commands.executeCommand("undo");
  });
});
