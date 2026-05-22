import * as path from "path";
import * as vscode from "vscode";
import { loadSymbols, mergeSymbols, Symbol as UnicodeSymbol } from "./unicodeSymbols";

export const LiteralBackslash: unique symbol = Symbol("violet.LiteralBackslash");

type PickResult = UnicodeSymbol | typeof LiteralBackslash | undefined;
type Picker = (symbols: UnicodeSymbol[]) => Promise<PickResult>;

let pickerOverride: Picker | undefined;

export function __setPickerForTesting(p: Picker): void {
  pickerOverride = p;
}
export function __clearPickerForTesting(): void {
  pickerOverride = undefined;
}

function defaultPicker(symbols: UnicodeSymbol[]): Promise<PickResult> {
  return new Promise<PickResult>((resolve) => {
    let resolved = false;
    const picker = vscode.window.createQuickPick<vscode.QuickPickItem & { symbol: UnicodeSymbol }>();
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.placeholder = "Search by name (e.g. Pi, forall, to). Type \\ for a literal backslash.";
    picker.items = symbols.map((s) => ({
      label: s.glyph,
      description: s.name,
      detail: (s.aliases ?? []).join(", "),
      symbol: s,
    }));
    picker.onDidChangeValue((v) => {
      if (v === "\\") {
        resolved = true;
        picker.hide();
        resolve(LiteralBackslash);
      }
    });
    picker.onDidAccept(() => {
      const selected = picker.selectedItems[0];
      resolved = true;
      picker.hide();
      resolve(selected?.symbol);
    });
    picker.onDidHide(() => {
      picker.dispose();
      if (!resolved) resolve(undefined);
    });
    picker.show();
  });
}

function loadAllSymbols(context: vscode.ExtensionContext): UnicodeSymbol[] {
  const bundledPath = path.join(context.extensionPath, "resources", "unicode-symbols.json");
  const builtIn = loadSymbols(bundledPath);
  const userRaw = vscode.workspace
    .getConfiguration("violet.unicodeInput")
    .get<UnicodeSymbol[]>("userSymbols", []);
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
      if (chosen === undefined) return;
      const text = chosen === LiteralBackslash ? "\\" : chosen.glyph;

      await editor.edit((b) => {
        for (const sel of editor.selections) {
          if (sel.isEmpty) {
            b.insert(sel.active, text);
          } else {
            b.replace(sel, text);
          }
        }
      });
    })
  );
}
