import * as Y from "yjs";

export class ConsoleHook {
  private readonly log = console.log;
  private logs: any[] = [];
  private hookConsole(){
    console.log = (...args: any[]) => {
      // this.log.apply(console, args);
      if (args[0] === 'Structs: ' || args[0] === 'DeleteSet: ') {
        args.splice(1, 1).forEach(log => this.logs.push(log));
      }else {
        console.warn('Caught log: ', args)
      }
    };
  }

  private unhookConsole(){
    console.log = this.log;
    this.logs = [];
  }

  public getUpdateSize(update: Uint8Array): number {
    this.hookConsole();
    Y.logUpdate(update);
    const deleteSet = this.logs.pop()?.clients;
    const structs = this.logs.pop();
    this.unhookConsole();
    let size = new Blob([JSON.stringify(structs)]).size;
    size += new Blob([JSON.stringify(Array.from(deleteSet))]).size
    return size;
  }
}
