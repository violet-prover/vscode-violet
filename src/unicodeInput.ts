import * as path from "path";
import * as vscode from "vscode";
import { loadSymbols, mergeSymbols, Symbol as UnicodeSymbol } from "./unicodeSymbols";
import { Recents } from "./unicodeRecents";

export const LiteralBackslash: unique symbol = Symbol("violet.LiteralBackslash");

type PickResult = UnicodeSymbol | typeof LiteralBackslash | undefined;
type Picker = (symbols: UnicodeSymbol[], recentCount: number) => Promise<PickResult>;

let pickerOverride: Picker | undefined;
let loadErrorShown = false;

export function __setPickerForTesting(p: Picker): void {
  pickerOverride = p;
}
export function __clearPickerForTesting(): void {
  pickerOverride = undefined;
}

function orderByRecents(all: UnicodeSymbol[], recents: string[]): UnicodeSymbol[] {
  const byName = new Map(all.map((s) => [s.name, s]));
  const head: UnicodeSymbol[] = [];
  for (const name of recents) {
    const s = byName.get(name);
    if (s) {
      head.push(s);
      byName.delete(name);
    }
  }
  return [...head, ...byName.values()];
}

function defaultPicker(symbols: UnicodeSymbol[], recentCount: number): Promise<PickResult> {
  return new Promise<PickResult>((resolve) => {
    let resolved = false;
    const picker = vscode.window.createQuickPick<vscode.QuickPickItem & { symbol?: UnicodeSymbol }>();
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.placeholder = "Search by name (e.g. Pi, forall, to). Type \\ for a literal backslash.";

    const plainItems = symbols.map((s) => ({
      label: s.glyph,
      description: s.name,
      detail: (s.aliases ?? []).join(", "),
      symbol: s as UnicodeSymbol | undefined,
    }));

    const separatedItems: Array<vscode.QuickPickItem & { symbol?: UnicodeSymbol }> =
      recentCount > 0
        ? [
            { label: "recent", kind: vscode.QuickPickItemKind.Separator },
            ...plainItems.slice(0, recentCount),
            { label: "more", kind: vscode.QuickPickItemKind.Separator },
            ...plainItems.slice(recentCount),
          ]
        : plainItems;

    picker.items = separatedItems;

    picker.onDidChangeValue((v) => {
      if (v === "\\") {
        resolved = true;
        picker.hide();
        resolve(LiteralBackslash);
        return;
      }
      // Strip separators while filtering; restore them when the filter clears.
      picker.items = v.length === 0 ? separatedItems : plainItems;
    });
    picker.onDidAccept(() => {
      const selected = picker.selectedItems[0];
      resolved = true;
      picker.hide();
      resolve(selected?.symbol ?? undefined);
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
  const merged = mergeSymbols(builtIn, userRaw);
  if (merged.length === 0 && !loadErrorShown) {
    loadErrorShown = true;
    void vscode.window.showErrorMessage(
      "Violet: failed to load unicode symbol table. The picker has no symbols."
    );
  }
  return merged;
}

export function registerUnicodeInput(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("violet.insertUnicode", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      // Load every invocation so user-defined symbols pick up settings changes
      // without an explicit reload listener.
      const symbols = loadAllSymbols(context);
      const recents = new Recents(context.globalState);

      const recentNames = recents.list();
      const orderedSymbols = orderByRecents(symbols, recentNames);
      const pick = pickerOverride ?? defaultPicker;
      const chosen = await pick(orderedSymbols, recentNames.length);
      if (chosen === undefined) return;

      const text = chosen === LiteralBackslash ? "\\" : chosen.glyph;
      await editor.edit((b) => {
        for (const sel of editor.selections) {
          if (sel.isEmpty) b.insert(sel.active, text);
          else b.replace(sel, text);
        }
      });

      if (chosen !== LiteralBackslash) {
        await recents.push(chosen.name);
      }
    })
  );
}
