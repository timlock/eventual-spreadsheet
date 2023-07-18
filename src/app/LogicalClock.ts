export class LogicalClock {
  private range: number | undefined;
  private counter: number = -1;

  public constructor(range?: number) {
    this.range = range;
  }

  public next(): number {
    if (this.range !== undefined && this.counter === this.range) {
      this.counter = -1;
    }
    this.counter++;
    return this.counter;
  }

  public current(): number {
    return this.counter;
  }

}
