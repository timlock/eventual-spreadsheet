import {Message} from "./Message";
import {LogicalClock} from "../LogicalClock";


class Entry<T> {
  private _messages: Message<T>[] = [];
  private clock: LogicalClock = new LogicalClock();
  private lastSent: number = -1;

  public add(message: Message<T>, sent: boolean): Message<T> {
    message.timestamp = this.clock.next();
    this._messages.push(message);
    if (sent) {
      this.lastSent = this.clock.current();
    }
    return message;
  }

  public messages(timestamp?: number): Message<T>[] {
    if(timestamp === undefined){
      return this._messages.slice();
    }
    return this._messages.slice(timestamp + 1);
  }

  public unsentMessages(): Message<T>[] {
    let start = this.lastSent === -1 ? 0 : this.lastSent;
    let end = this.clock.current() + 1
    let unsent= this._messages.slice(start , end);
    this.lastSent = this.clock.current();
    return unsent;
  }
}

export class MessageBuffer<T> {
  private buffer: Map<string, Entry<T>> = new Map();

  public add(message: Message<T>, sent: boolean): Message<T> | undefined {
    if (message.destination === undefined) {
      console.warn('Message is missing destination and/or timestamp ', message);
      return undefined;
    }
    let entry = this.buffer.get(message.destination) || new Entry<T>();
    this.buffer.set(message.destination, entry);
    message = entry.add(message, sent);
    return message;
  }

  public getMissingMessages(destination: string, timestamp?: number): Message<T>[] {
    return this.buffer.get(destination)?.messages(timestamp) || [];
  }

  public getUnsentMessages(): Message<T>[] {
    let unsent: Message<T>[] = [];
    this.buffer.forEach(entry => unsent.push(...entry.unsentMessages()));
    return unsent;
  }
}

