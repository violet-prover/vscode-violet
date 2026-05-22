import * as path from "path";
import * as vscode from "vscode";
import { loadSymbols, mergeSymbols, Symbol as UnicodeSymbol } from "./unicodeSymbols";
import { Recents } from "./unicodeRecents";

export const LiteralBackslash: unique symbol = Symbol("violet.LiteralBackslash");

type PickResult = UnicodeSymbol | typeof LiteralBackslash | undefined;
type Picker = (symbols: UnicodeSymbol[], recentCount: number) => Promise<PickResult>;

let pickerOverride: Picker | undefined;

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

    const items: Array<vscode.QuickPickItem & { symbol?: UnicodeSymbol }> = [];
    symbols.forEach((s, i) => {
      if (i === recentCount && recentCount > 0) {
        items.push({ label: "more", kind: vscode.QuickPickItemKind.Separator });
      }
      items.push({
        label: s.glyph,
        description: s.name,
        detail: (s.aliases ?? []).join(", "),
        symbol: s,
      });
    });
    if (recentCount > 0) {
      items.unshift({ label: "recent", kind: vscode.QuickPickItemKind.Separator });
    }
    picker.items = items;

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
  return mergeSymbols(builtIn, userRaw);
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

      const orderedSymbols = orderByRecents(symbols, recents.list());
      const pick = pickerOverride ?? defaultPicker;
      const chosen = await pick(orderedSymbols, recents.list().length);
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
