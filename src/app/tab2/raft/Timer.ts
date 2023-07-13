export class Timer {
  private readonly min: number;
  private readonly max: number;
  private readonly fixed: number;
  private end: number | undefined;

  constructor(min = 3000, max = 6000, fixed = 1500) {
    this.min = min;
    this.max = max;
    this.fixed = fixed;
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
