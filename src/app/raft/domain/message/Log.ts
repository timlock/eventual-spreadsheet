import {RaftMessage, Term} from "../Types";

export interface Log<T> {
  content: T;
  term: Term;
}

export function isLog<T>(message: RaftMessage<T>): message is Log<T> {
  return (
    typeof message === 'object' &&
    'content' in message &&
    'term' in message
  );
}

