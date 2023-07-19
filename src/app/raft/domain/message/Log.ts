import {RaftMessage, Term} from "../Types";

export interface Log {
  content: any;
  term: Term;
}

export function isLog(message: RaftMessage): message is Log {
  return (
    typeof message === 'object' &&
    'content' in message &&
    'term' in message
  );
}

