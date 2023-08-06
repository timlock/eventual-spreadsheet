export class Timer {
  private end: number | undefined;

  constructor(
    private readonly min = 150,
    private readonly max = 300,
    private readonly fixed = 50
  ) {
  }

  public fixedDuration() {
    this.end = this.fixed + Date.now();
  }

  public randomDuration() {
    this.end = Math.floor(Math.random() * (this.max - this.min) + this.min + Date.now());
  }

  public stop(): void {
    this.end = undefined;
  }

  public isActive(): boolean {
    return this.end !== undefined;
  }

  public isTimeUp(): boolean {
    if (this.end === undefined) {
      return false;
    }
    return Date.now() >= this.end;
  }

  public remainingTime(): number | undefined {
    if (this.end === undefined) {
      return undefined
    }
    return this.end - Date.now();
  }
}
