export interface Message<T> {
  sender: string;
  destination?: string;
  payload?: T;
}


