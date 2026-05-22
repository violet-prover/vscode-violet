import * as assert from "assert";
import { Recents, MementoLike } from "../src/unicodeRecents";

function fakeMemento(initial: Record<string, unknown> = {}): MementoLike {
  const store = new Map<string, unknown>(Object.entries(initial));
  return {
    get<T>(key: string): T | undefined {
      return store.get(key) as T | undefined;
    },
    async update(key: string, value: unknown): Promise<void> {
      store.set(key, value);
    },
  };
}

suite("unicode recents", () => {
  test("starts empty", () => {
    const r = new Recents(fakeMemento());
    assert.deepStrictEqual(r.list(), []);
  });

  test("push moves an item to the front (MRU)", async () => {
    const r = new Recents(fakeMemento());
    await r.push("pi");
    await r.push("to");
    await r.push("pi");
    assert.deepStrictEqual(r.list(), ["pi", "to"]);
  });

  test("caps at 10 entries", async () => {
    const r = new Recents(fakeMemento());
    for (let i = 0; i < 15; i++) await r.push(`s${i}`);
    const list = r.list();
    assert.strictEqual(list.length, 10);
    assert.strictEqual(list[0], "s14");
    assert.strictEqual(list[9], "s5");
  });

  test("persists across instances using the same memento", async () => {
    const mem = fakeMemento();
    const r1 = new Recents(mem);
    await r1.push("forall");
    const r2 = new Recents(mem);
    assert.deepStrictEqual(r2.list(), ["forall"]);
  });

  test("ignores garbage in the memento", () => {
    const mem = fakeMemento({ "violet.unicodeInput.recents": "not an array" });
    const r = new Recents(mem);
    assert.deepStrictEqual(r.list(), []);
  });
});
