
export class TestResult {
  constructor(
    public readonly bytes: number,
    public readonly messages: number,
    public readonly time: number,
    public readonly type?: TestType
  ) {
  }

  public toCSVBody(): string {
    return `${this.type},${this.time},${this.bytes},${this.messages}`
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
