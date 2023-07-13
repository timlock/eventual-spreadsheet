export interface Message<T> {
  sender: string;
  destination?: string;
  payload?: T;
}

export interface Payload {
  action: string;
  column: string | undefined;
  row: string | undefined;
  input: string | undefined;
}

