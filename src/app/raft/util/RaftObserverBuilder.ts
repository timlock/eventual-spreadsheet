import {RaftNodeObserver} from "../controller/RaftNodeObserver";
import {NodeId, RaftMessage} from "../domain/Types";
import {Log} from "../domain/message/Log";
import {RaftMetaData} from "./RaftMetaData";

export class RaftObserverBuilder<T> {
  private _sendMessage: ((receiver: NodeId, message: RaftMessage<T>) => void) | undefined;
  private _onLog: ((log: Log<T>) => void) | undefined;
  private _restartHearBeatTimer: (() => void) | undefined;
  private _restartElectionTimer: (() => void) | undefined;
  private _onStateChange: ((state: RaftMetaData) => void) | undefined;
  private _sendLog: ((destination: NodeId, log: Log<T>) => void) | undefined;

  public sendMessage(value: ((receiver: NodeId, message: RaftMessage<T>) => void)): RaftObserverBuilder<T> {
    this._sendMessage = value;
    return this;
  }

  public onLog(value: (log: Log<T>) => void): RaftObserverBuilder<T> {
    this._onLog = value;
    return this;
  }

  public restartHearBeatTimer(value: () => void): RaftObserverBuilder<T> {
    this._restartHearBeatTimer = value;
    return this;
  }

  public restartElectionTimer(value: () => void): RaftObserverBuilder<T> {
    this._restartElectionTimer = value;
    return this;
  }

  public onStateChange(value: (state: RaftMetaData) => void): RaftObserverBuilder<T> {
    this._onStateChange = value;
    return this;
  }

  public sendLog(value: ((destination: NodeId, log: Log<T>) => void)): RaftObserverBuilder<T> {
    this._sendLog = value;
    return this;
  }


  public build(): RaftNodeObserver<T> {
    const onLog = this._onLog;
    const restartElectionTimer = this._restartElectionTimer;
    const restartHearBeatTimer = this._restartHearBeatTimer;
    const sendMessage = this._sendMessage;
    const onStateChange = this._onStateChange;
    const sendLog = this._sendLog;

    return new class implements RaftNodeObserver<T> {
      onLog(log: Log<T>): void {
        if (onLog !== undefined) {
          onLog(log);
        }
      }

      restartElectionTimer(): void {
        if (restartElectionTimer !== undefined) {
          restartElectionTimer();
        }
      }

      restartHeartbeatTimer(): void {
        if (restartHearBeatTimer !== undefined) {
          restartHearBeatTimer();
        }
      }

      sendRaftMessage(receiver: NodeId, message: RaftMessage<T>): void {
        if (sendMessage !== undefined) {
          sendMessage(receiver, message);
        }
      }

      onStateChange(state: RaftMetaData): void {
        if (onStateChange !== undefined) {
          onStateChange(state);
        }
      }

      sendLog(destination: NodeId, log: Log<T>): void {
        if (sendLog !== undefined) {
          sendLog(destination, log);
        }
      }


    }
  }
}


