import * as assert from "assert";
import * as path from "path";
import { loadSymbols, Symbol, mergeSymbols } from "../src/unicodeSymbols";

suite("unicode symbols loader", () => {
  const fixture = path.resolve(__dirname, "../../test/fixtures/symbols.json");

  test("loads all entries from a JSON file", () => {
    const symbols: Symbol[] = loadSymbols(fixture);
    assert.strictEqual(symbols.length, 3);
  });

  test("maps name to glyph", () => {
    const symbols = loadSymbols(fixture);
    const pi = symbols.find((s) => s.name === "pi");
    assert.ok(pi);
    assert.strictEqual(pi!.glyph, "π");
  });

  test("preserves aliases when present", () => {
    const symbols = loadSymbols(fixture);
    const to = symbols.find((s) => s.name === "to");
    assert.deepStrictEqual(to!.aliases, ["rightarrow", "->"]);
  });

  test("returns empty array on missing file", () => {
    const symbols = loadSymbols("/tmp/does-not-exist.json");
    assert.deepStrictEqual(symbols, []);
  });
});

suite("unicode symbols merge", () => {
  const base: Symbol[] = [
    { name: "pi", glyph: "π" },
    { name: "to", glyph: "→" },
  ];

  test("appends new user symbols", () => {
    const merged = mergeSymbols(base, [{ name: "myop", glyph: "⊕" }]);
    assert.strictEqual(merged.length, 3);
    assert.strictEqual(merged.find((s) => s.name === "myop")!.glyph, "⊕");
  });

  test("user entry overrides built-in with same name", () => {
    const merged = mergeSymbols(base, [{ name: "pi", glyph: "Π" }]);
    assert.strictEqual(merged.length, 2);
    assert.strictEqual(merged.find((s) => s.name === "pi")!.glyph, "Π");
  });

  test("skips invalid user entries but keeps the rest", () => {
    const merged = mergeSymbols(base, [
      { name: "ok", glyph: "✓" } as Symbol,
      { name: "", glyph: "x" } as Symbol,
      { name: "no-glyph" } as unknown as Symbol,
      null as unknown as Symbol,
    ]);
    assert.strictEqual(merged.length, 3);
    assert.ok(merged.find((s) => s.name === "ok"));
  });
});
