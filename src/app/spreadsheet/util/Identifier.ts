export class Identifier {
  private counter = 0;
  private readonly _uuid: string;

  public constructor(tag: string) {
    this._uuid = tag;
  }

  public static generate(): Identifier {
    return new Identifier(crypto.randomUUID());
  }


  get uuid(): string {
    return this._uuid;
  }

  public next(): string {
    return this._uuid + this.counter++;
  }

  public multiple(amount: number): string[] {
    let list: string[] = [];
    for (let i = 0; i < amount; i++) {
      list.push(this.next());
    }
    return list;
  }

  public getLastId(): string {
    return this._uuid + this.counter;
  }
}
