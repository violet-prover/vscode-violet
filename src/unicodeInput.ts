import * as path from "path";
import * as vscode from "vscode";
import { loadSymbols, mergeSymbols, Symbol } from "./unicodeSymbols";

type Picker = (symbols: Symbol[]) => Promise<Symbol | undefined>;

let pickerOverride: Picker | undefined;

export function __setPickerForTesting(p: Picker): void {
  pickerOverride = p;
}
export function __clearPickerForTesting(): void {
  pickerOverride = undefined;
}

function defaultPicker(symbols: Symbol[]): Promise<Symbol | undefined> {
  return new Promise<Symbol | undefined>((resolve) => {
    const picker = vscode.window.createQuickPick<vscode.QuickPickItem & { symbol: Symbol }>();
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.placeholder = "Search by name (e.g. Pi, forall, to)";
    picker.items = symbols.map((s) => ({
      label: s.glyph,
      description: s.name,
      detail: (s.aliases ?? []).join(", "),
      symbol: s,
    }));
    picker.onDidAccept(() => {
      const selected = picker.selectedItems[0];
      picker.hide();
      resolve(selected?.symbol);
    });
    picker.onDidHide(() => {
      picker.dispose();
      resolve(undefined);
    });
    picker.show();
  });
}

function loadAllSymbols(context: vscode.ExtensionContext): Symbol[] {
  const bundledPath = path.join(context.extensionPath, "resources", "unicode-symbols.json");
  const builtIn = loadSymbols(bundledPath);
  const userRaw = vscode.workspace
    .getConfiguration("violet.unicodeInput")
    .get<Symbol[]>("userSymbols", []);
  return mergeSymbols(builtIn, userRaw);
}

export function registerUnicodeInput(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("violet.insertUnicode", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const symbols = loadAllSymbols(context);
      const pick = pickerOverride ?? defaultPicker;
      const chosen = await pick(symbols);
      if (!chosen) return;

      await editor.edit((b) => {
        for (const sel of editor.selections) {
          if (sel.isEmpty) {
            b.insert(sel.active, chosen.glyph);
          } else {
            b.replace(sel, chosen.glyph);
          }
        }
      });
    })
  );
}
