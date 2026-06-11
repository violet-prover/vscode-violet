import * as path from "path";
import * as vscode from "vscode";
import { loadSymbols, mergeSymbols, Symbol as UnicodeSymbol } from "./unicodeSymbols";
import { loadSnippets, mergeSnippets, Snippet } from "./snippets";
import { Recents } from "./unicodeRecents";

export const LiteralBackslash: unique symbol = Symbol("violet.LiteralBackslash");

type PickResult = UnicodeSymbol | Snippet | typeof LiteralBackslash | undefined;
type Picker = (
  symbols: UnicodeSymbol[],
  snippets: Snippet[],
  symbolRecentCount: number
) => Promise<PickResult>;

type QPItem = vscode.QuickPickItem & { symbol?: UnicodeSymbol; snippet?: Snippet };

let pickerOverride: Picker | undefined;
let loadErrorShown = false;

export function __setPickerForTesting(p: Picker): void {
  pickerOverride = p;
}
export function __clearPickerForTesting(): void {
  pickerOverride = undefined;
}

function isSnippet(x: UnicodeSymbol | Snippet): x is Snippet {
  return typeof (x as Snippet).body === "string";
}

// Recents are stored namespaced ("glyph:<name>" / "snippet:<name>") so a glyph
// and a snippet that share a name do not collide. Legacy unprefixed entries are
// treated as glyphs.
export function recentsFor(kind: "glyph" | "snippet", all: string[]): string[] {
  const prefix = `${kind}:`;
  const out: string[] = [];
  for (const e of all) {
    if (e.startsWith("glyph:") || e.startsWith("snippet:")) {
      if (e.startsWith(prefix)) out.push(e.slice(prefix.length));
    } else if (kind === "glyph") {
      out.push(e); // legacy bare entry
    }
  }
  return out;
}

function orderByRecents<T extends { name: string }>(all: T[], recents: string[]): T[] {
  const byName = new Map(all.map((s) => [s.name, s]));
  const head: T[] = [];
  for (const name of recents) {
    const s = byName.get(name);
    if (s) {
      head.push(s);
      byName.delete(name);
    }
  }
  return [...head, ...byName.values()];
}

function defaultPicker(
  symbols: UnicodeSymbol[],
  snippets: Snippet[],
  symbolRecentCount: number
): Promise<PickResult> {
  return new Promise<PickResult>((resolve) => {
    let resolved = false;
    const picker = vscode.window.createQuickPick<QPItem>();
    picker.matchOnDescription = true;
    picker.matchOnDetail = true;
    picker.placeholder = "Search symbols or snippets by name. Type \\ for a literal backslash.";

    const symbolItems: QPItem[] = symbols.map((s) => ({
      label: s.glyph,
      description: s.name,
      detail: (s.aliases ?? []).join(", "),
      symbol: s,
    }));
    const snippetItems: QPItem[] = snippets.map((s) => ({
      label: s.name,
      description: "snippet",
      detail: s.detail ?? (s.aliases ?? []).join(", "),
      snippet: s,
    }));

    const symbolSection: QPItem[] =
      symbolRecentCount > 0
        ? [
            { label: "recent", kind: vscode.QuickPickItemKind.Separator },
            ...symbolItems.slice(0, symbolRecentCount),
            { label: "symbols", kind: vscode.QuickPickItemKind.Separator },
            ...symbolItems.slice(symbolRecentCount),
          ]
        : [{ label: "symbols", kind: vscode.QuickPickItemKind.Separator }, ...symbolItems];

    const snippetSection: QPItem[] =
      snippetItems.length > 0
        ? [{ label: "snippets", kind: vscode.QuickPickItemKind.Separator }, ...snippetItems]
        : [];

    const separatedItems: QPItem[] = [...symbolSection, ...snippetSection];
    const flatItems: QPItem[] = [...symbolItems, ...snippetItems];

    picker.items = separatedItems;

    picker.onDidChangeValue((v) => {
      if (v === "\\") {
        resolved = true;
        picker.hide();
        resolve(LiteralBackslash);
        return;
      }
      // Strip separators while filtering; restore them when the filter clears.
      picker.items = v.length === 0 ? separatedItems : flatItems;
    });
    picker.onDidAccept(() => {
      const selected = picker.selectedItems[0];
      resolved = true;
      picker.hide();
      resolve(selected?.snippet ?? selected?.symbol ?? undefined);
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

function loadAllSnippets(context: vscode.ExtensionContext): Snippet[] {
  const bundledPath = path.join(context.extensionPath, "resources", "snippets.json");
  const builtIn = loadSnippets(bundledPath);
  const userRaw = vscode.workspace
    .getConfiguration("violet.snippetInput")
    .get<Snippet[]>("userSnippets", []);
  return mergeSnippets(builtIn, userRaw);
}

async function insertText(editor: vscode.TextEditor, text: string): Promise<void> {
  await editor.edit((b) => {
    for (const sel of editor.selections) {
      if (sel.isEmpty) b.insert(sel.active, text);
      else b.replace(sel, text);
    }
  });
}

export function registerUnicodeInput(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("violet.insertUnicode", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      // Load every invocation so user-defined entries pick up settings changes
      // without an explicit reload listener.
      const symbols = loadAllSymbols(context);
      const snippets = loadAllSnippets(context);
      if (symbols.length === 0 && snippets.length === 0 && !loadErrorShown) {
        loadErrorShown = true;
        void vscode.window.showErrorMessage(
          "Violet: failed to load unicode symbol and snippet tables. The picker is empty."
        );
      }

      const recents = new Recents(context.globalState);
      const allRecents = recents.list();
      const glyphRecents = recentsFor("glyph", allRecents);
      const snippetRecents = recentsFor("snippet", allRecents);

      const orderedSymbols = orderByRecents(symbols, glyphRecents);
      const orderedSnippets = orderByRecents(snippets, snippetRecents);
      const symbolRecentCount = glyphRecents.filter((n) =>
        symbols.some((s) => s.name === n)
      ).length;

      const pick = pickerOverride ?? defaultPicker;
      const chosen = await pick(orderedSymbols, orderedSnippets, symbolRecentCount);
      if (chosen === undefined) return;

      if (chosen === LiteralBackslash) {
        await insertText(editor, "\\");
        return;
      }

      if (isSnippet(chosen)) {
        await editor.insertSnippet(new vscode.SnippetString(chosen.body));
        await recents.push(`snippet:${chosen.name}`);
        return;
      }

      await insertText(editor, chosen.glyph);
      await recents.push(`glyph:${chosen.name}`);
    })
  );
}
