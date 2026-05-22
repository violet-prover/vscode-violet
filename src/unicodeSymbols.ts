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
