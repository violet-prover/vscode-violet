import * as assert from "assert";
import * as path from "path";
import { loadSymbols, Symbol } from "../src/unicodeSymbols";

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
