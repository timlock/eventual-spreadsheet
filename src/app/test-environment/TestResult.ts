
export class TestResult {
  constructor(
    public readonly bytes: number,
    public readonly messages: number,
    public readonly time: number,
    public readonly type?: TestType,
    public readonly medianDelay?: number
  ) {
  }

  public toCSVBody(): string {
    return `${this.time},${this.bytes},${this.messages},${this.medianDelay}`
  }

  public compareType(other: TestResult): number {
    if (other.type === this.type) {
      return 0;
    }
    if (other.type === TestType.GROW) {
      return 1;
    }
    if (other.type === TestType.CLEAR) {
      return -1;
    }
    throw new Error('Should not be reached');
  }

  public static empty() : TestResult{
    return new TestResult(0,0,0)
  }
}

export enum TestType {
  GROW = 'GROW',
  CLEAR = 'CLEAR'
}
