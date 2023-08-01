import {RaftNodeObserver} from "../controller/RaftNodeObserver";
import {NodeId, RaftMessage} from "../domain/Types";
import {Log} from "../domain/message/Log";
import {RaftMetaData} from "./RaftMetaData";

export class RaftObserverBuilder {
  private _sendMessage: ((receiver: NodeId, message: RaftMessage) => void) | undefined;
  private _onLog: ((log: Log) => void) | undefined;
  private _restartHearBeatTimer: (() => void) | undefined;
  private _restartElectionTimer: (() => void) | undefined;
  private _onStateChange: ((state: RaftMetaData) => void) | undefined;

  public sendMessage(value: ((receiver: NodeId, message: RaftMessage) => void)): RaftObserverBuilder {
    this._sendMessage = value;
    return this;
  }

  public onLog(value: (log: Log) => void): RaftObserverBuilder {
    this._onLog = value;
    return this;
  }

  public restartHearBeatTimer(value: () => void): RaftObserverBuilder {
    this._restartHearBeatTimer = value;
    return this;
  }

  public restartElectionTimer(value: () => void): RaftObserverBuilder {
    this._restartElectionTimer = value;
    return this;
  }

  public onStateChange(value: (state: RaftMetaData) => void): RaftObserverBuilder {
    this._onStateChange = value;
    return this;
  }




  public build(): RaftNodeObserver {
    let onLog = this._onLog;
    let restartElectionTimer = this._restartElectionTimer;
    let restartHearBeatTimer = this._restartHearBeatTimer;
    let sendMessage = this._sendMessage;
    let onStateChange = this._onStateChange;

    return new class implements RaftNodeObserver {
      onLog(log: Log): void {
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

      sendMessage(receiver: NodeId, message: RaftMessage): void {
        if (sendMessage !== undefined) {
          sendMessage(receiver, message);
        }
      }

      onStateChange(state: RaftMetaData): void {
        if (onStateChange !== undefined) {
          onStateChange(state);
        }
      }



    }
  }
}


