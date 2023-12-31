import {Message} from "../domain/Message";


export class MessageBuffer<T> {
  private records: Map<string, number> = new Map();
  private buffer: Message<T>[] = [];

  public add(message: Message<T>): Message<T> {
    message.logicalTimestamp = this.buffer.length;
    this.buffer.push(message);
    return message;
  }

  public addNode(destination: string, timestamp = -1) {
    this.records.set(destination, timestamp);
  }

  public getMissingMessages(destination: string, timestamp = -1): Message<T>[] {
    return this.buffer.slice(timestamp + 1).map(message => this.copyMessage(message, destination));
  }

  private copyMessage(message: Message<T>, destination: string): Message<T> {
    return {
      source: message.source,
      destination: destination,
      payload: message.payload,
      logicalTimestamp: message.logicalTimestamp
    }
  }

  public getUnsentMessages(): Message<T>[] {
    const result = Array.from(this.records).flatMap(record => this.getMissingMessages(record[0], record[1]));
    for (const record of this.records) {
      this.records.set(record[0], this.buffer.length);
    }
    return result;
  }

}
