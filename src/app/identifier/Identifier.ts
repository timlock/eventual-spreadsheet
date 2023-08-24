import {LogicalClock} from "./LogicalClock";

export class Identifier {
  private clock: LogicalClock;

  public constructor(
    private readonly _uuid: string,
    range?: number
  ) {
    this.clock = new LogicalClock(range);
  }

  public static generate(): Identifier {
    return new Identifier(crypto.randomUUID());
  }


  get uuid(): string {
    return this._uuid;
  }

  public next(): string {
    return this._uuid + this.clock.next();
  }

  public multiple(amount: number): string[] {
    const list: string[] = [];
    for (let i = 0; i < amount; i++) {
      list.push(this.next());
    }
    return list;
  }

  public getLastId(): string {
    return this._uuid + this.clock.current();
  }
}
