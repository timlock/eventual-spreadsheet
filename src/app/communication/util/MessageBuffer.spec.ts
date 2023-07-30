import {MessageBuffer} from "./MessageBuffer";
import {Message} from "../domain/Message";
import {Identifier} from "../../identifier/Identifier";


describe('MessageBuffer', () => {
  let messageBuffer: MessageBuffer<string>;
  let identifier: Identifier;
  beforeEach(() => {
    messageBuffer = new MessageBuffer<string>();
    identifier = new Identifier('test')
  });

  it('add message', () => {
    let message: Message<string> = {
      source: identifier.next(),
      payload: identifier.next(),
      destination: identifier.next()
    };
    messageBuffer.add(message);
    expect(message.timestamp).toBeDefined();
    expect(message.timestamp).toEqual(0);
  });

  it('get missing message', () => {
    let message: Message<string> = {
      source: identifier.next(),
      payload: identifier.next(),
      destination: identifier.next()
    };
    messageBuffer.add(message);
    messageBuffer.addNode(identifier.getLastId());
    let actual = messageBuffer.getMissingMessages(identifier.getLastId());
    expect(actual.length).toEqual(1);
    expect(actual[0]).toEqual(message);
  });

  it('get multiple missing messages', () => {
    let message: Message<string> = {
      source: identifier.next(),
      payload: identifier.next(),
      destination: identifier.next()
    };
    messageBuffer.add(message);
    messageBuffer.add(message);
    let actual = messageBuffer.getMissingMessages(identifier.getLastId(), 0);
    expect(actual.length).toEqual(1);
    expect(actual[0]).toEqual(message);
  });

  it('get unsent messages', () => {
    let message: Message<string> = {
      source: identifier.next(),
      payload: identifier.next(),
      destination: identifier.next()
    };
    messageBuffer.add(message);
    messageBuffer.add(message);
    messageBuffer.add(message);
    messageBuffer.addNode(identifier.getLastId(),0);
    messageBuffer.addNode(identifier.next());
    let actual = messageBuffer.getUnsentMessages();
    expect(actual.length).toEqual(5);
    expect(actual.filter(msg => msg.destination === message.destination).length).toEqual(2)
    expect(actual.filter(msg => msg.destination === identifier.getLastId()).length).toEqual(3)
  });

});
