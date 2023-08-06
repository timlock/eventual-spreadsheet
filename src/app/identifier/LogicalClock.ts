export class LogicalClock {
  private counter: number = -1;

  public constructor(private range?: number) {
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
