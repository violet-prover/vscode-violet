import * as fs from "fs";

export interface Snippet {
  name: string;
  body: string;
  aliases?: string[];
  detail?: string;
}

function coerce(entry: unknown): Snippet | undefined {
  if (!entry || typeof entry !== "object") return undefined;
  const e = entry as { name?: unknown; body?: unknown; aliases?: unknown; detail?: unknown };
  if (typeof e.name !== "string" || e.name.length === 0) return undefined;
  if (typeof e.body !== "string" || e.body.length === 0) return undefined;
  const aliases =
    Array.isArray(e.aliases) && e.aliases.every((a) => typeof a === "string")
      ? (e.aliases as string[])
      : undefined;
  const detail = typeof e.detail === "string" ? e.detail : undefined;
  return {
    name: e.name,
    body: e.body,
    ...(aliases ? { aliases } : {}),
    ...(detail ? { detail } : {}),
  };
}

export function loadSnippets(jsonPath: string): Snippet[] {
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
  const out: Snippet[] = [];
  for (const entry of parsed) {
    const s = coerce(entry);
    if (s) out.push(s);
  }
  return out;
}

export function mergeSnippets(base: Snippet[], user: Snippet[]): Snippet[] {
  const byName = new Map<string, Snippet>();
  for (const s of base) byName.set(s.name, s);
  for (const entry of user) {
    const s = coerce(entry);
    if (s) byName.set(s.name, s);
  }
  return Array.from(byName.values());
}
