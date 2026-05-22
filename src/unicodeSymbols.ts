import * as fs from "fs";

export interface Symbol {
  name: string;
  glyph: string;
  aliases?: string[];
}

export function loadSymbols(jsonPath: string): Symbol[] {
  let raw: string;
  try {
    raw = fs.readFileSync(jsonPath, "utf8");
  } catch {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: Symbol[] = [];
  for (const entry of parsed) {
    if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as { name: unknown }).name === "string" &&
      typeof (entry as { glyph: unknown }).glyph === "string"
    ) {
      const e = entry as { name: string; glyph: string; aliases?: unknown };
      const aliases =
        Array.isArray(e.aliases) && e.aliases.every((a) => typeof a === "string")
          ? (e.aliases as string[])
          : undefined;
      out.push({ name: e.name, glyph: e.glyph, ...(aliases ? { aliases } : {}) });
    }
  }
  return out;
}

export function mergeSymbols(base: Symbol[], user: Symbol[]): Symbol[] {
  const byName = new Map<string, Symbol>();
  for (const s of base) byName.set(s.name, s);
  for (const entry of user) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.name !== "string" || entry.name.length === 0) continue;
    if (typeof entry.glyph !== "string" || entry.glyph.length === 0) continue;
    const aliases =
      Array.isArray(entry.aliases) && entry.aliases.every((a) => typeof a === "string")
        ? entry.aliases
        : undefined;
    byName.set(entry.name, {
      name: entry.name,
      glyph: entry.glyph,
      ...(aliases ? { aliases } : {}),
    });
  }
  return Array.from(byName.values());
}
