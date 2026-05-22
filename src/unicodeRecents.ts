export interface MementoLike {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): Thenable<void> | Promise<void>;
}

const KEY = "violet.unicodeInput.recents";
const CAP = 10;

export class Recents {
  private cache: string[];

  constructor(private memento: MementoLike) {
    const raw = memento.get<unknown>(KEY);
    this.cache = Array.isArray(raw) && raw.every((x) => typeof x === "string")
      ? (raw as string[]).slice(0, CAP)
      : [];
  }

  list(): string[] {
    return this.cache.slice();
  }

  async push(name: string): Promise<void> {
    const next = [name, ...this.cache.filter((n) => n !== name)].slice(0, CAP);
    this.cache = next;
    await this.memento.update(KEY, next);
  }
}
