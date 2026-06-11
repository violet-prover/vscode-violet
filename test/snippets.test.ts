import * as assert from "assert";
import * as path from "path";
import { loadSnippets, mergeSnippets, Snippet } from "../src/snippets";

suite("snippets loader", () => {
  const fixture = path.resolve(__dirname, "../../test/fixtures/snippets.json");

  test("loads only valid entries (string name + string body)", () => {
    const snippets = loadSnippets(fixture);
    assert.strictEqual(snippets.length, 2);
    assert.deepStrictEqual(
      snippets.map((s) => s.name).sort(),
      ["data", "let"]
    );
  });

  test("maps name to body", () => {
    const snippets = loadSnippets(fixture);
    const letS = snippets.find((s) => s.name === "let");
    assert.ok(letS);
    assert.strictEqual(letS!.body, "\\let ${1:name} = ${0}");
  });

  test("preserves aliases and detail when present", () => {
    const snippets = loadSnippets(fixture);
    const data = snippets.find((s) => s.name === "data")!;
    assert.deepStrictEqual(data.aliases, ["inductive"]);
    assert.strictEqual(data.detail, "inductive type");
  });

  test("returns empty array on missing file", () => {
    assert.deepStrictEqual(loadSnippets("/tmp/does-not-exist.json"), []);
  });
});

suite("snippets merge", () => {
  const base: Snippet[] = [
    { name: "let", body: "\\let ${1:name} = ${0}" },
    { name: "data", body: "\\data ${1:Name}" },
  ];

  test("appends new user snippets", () => {
    const merged = mergeSnippets(base, [{ name: "mything", body: "\\mything ${0}" }]);
    assert.strictEqual(merged.length, 3);
    assert.strictEqual(merged.find((s) => s.name === "mything")!.body, "\\mything ${0}");
  });

  test("user entry overrides built-in with same name", () => {
    const merged = mergeSnippets(base, [{ name: "let", body: "OVERRIDE" }]);
    assert.strictEqual(merged.length, 2);
    assert.strictEqual(merged.find((s) => s.name === "let")!.body, "OVERRIDE");
  });

  test("skips invalid user entries but keeps the rest", () => {
    const merged = mergeSnippets(base, [
      { name: "ok", body: "\\ok ${0}" } as Snippet,
      { name: "", body: "x" } as Snippet,
      { name: "no-body" } as unknown as Snippet,
      null as unknown as Snippet,
    ]);
    assert.strictEqual(merged.length, 3);
    assert.ok(merged.find((s) => s.name === "ok"));
  });
});
