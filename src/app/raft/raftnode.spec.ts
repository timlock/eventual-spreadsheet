import {Identifier} from "../Identifier";
import {TestBed} from "@angular/core/testing";
import {RaftObserverBuilder} from "./RaftObserverBuilder";
import {isRequestVoteRequest, isRequestVoteResponse, RequestVoteRequest} from "./domain/message/RequestVoteRequest";
import {RaftNode} from "./RaftNode";
import {NodeId, RaftMessage} from "./domain/Types";
import {AppendEntriesRequest, isAppendEntriesRequest, isAppendEntriesResponse} from "./domain/message/AppendEntriesRequest";
import {RaftNodeObserver} from "./RaftNodeObserver";
import {Log} from "./domain/message/Log";


function buildCluster(observer: RaftNodeObserver, nodeIds: NodeId[]): Map<string, RaftNode> {
  let cluster: Map<string, RaftNode> = new Map();
  for (const nodeId of nodeIds) {
    let node = new RaftNode(nodeId, observer);
    cluster.set(nodeId, node);
  }
  connectCluster(cluster);
  return cluster;
}

function connectCluster(nodes: Map<string, RaftNode>) {
  nodes.forEach((node, key) => {
    nodes.forEach(({}, otherKey) => {
      if (otherKey !== key) {
        node.addNode(otherKey);
      }
    })
  })
}

describe('Raft Node', () => {
  let identifier: Identifier;
  let cluster: Map<string, RaftNode>;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    identifier = new Identifier('test');
    cluster = new Map();
  });

  it('start election after timeout', () => {
    let guard = false;
    let restartElectionTimer = () => {
      if (!guard) {
        guard = true;
        node.timeout();
      }
    }
    let sendMessage = (receiver: string, message: RaftMessage) => {
      expect(message.term).toEqual(1);
      expect(isRequestVoteRequest(message)).toBeTrue();
      let request = message as RequestVoteRequest;
      expect(request.lastLogIndex).toEqual(0);
      expect(request.lastLogTerm).toBeUndefined();
    }
    let observer = new RaftObserverBuilder().restartElectionTimer(restartElectionTimer).sendMessage(sendMessage).build();

    let node = new RaftNode(identifier.uuid, observer);
    for (let i = 0; i < 4; i++) {
      node.addNode(identifier.next());
    }
    node.start();
  });

  it('win election', () => {
    let candidateId = identifier.next();
    let candidateSendMessage = (receiver: string, message: RaftMessage) => {
      let isExpectedMessage = isRequestVoteRequest(message) || isAppendEntriesRequest(message)
      expect(isExpectedMessage).toBeTrue();
      if (isRequestVoteRequest(message)) {
        cluster.get(receiver)?.handleMessage(message);
      }
    }
    let candidateObserver = new RaftObserverBuilder().sendMessage(candidateSendMessage).build();
    let candidateNode = new RaftNode(candidateId, candidateObserver);
    cluster.set(candidateId, candidateNode);
    let followerSendMessage = (receiver: string, message: RaftMessage) => {
      expect(receiver).toEqual(candidateId);
      expect(isRequestVoteResponse(message)).toBeTrue();
      if (isRequestVoteResponse(message)) {
        expect(message.term).toEqual(1);
        expect(message.voteGranted).toBeTrue();
        cluster.get(receiver)?.handleMessage(message);
      }
    }
    for (let i = 1; i < 4; i++) {
      let nodeObserver = new RaftObserverBuilder().sendMessage(followerSendMessage).build();
      let node = new RaftNode(identifier.next(), nodeObserver);
      cluster.set(node.nodeId, node);
    }
    connectCluster(cluster);
    candidateNode.timeout();
    expect(candidateNode.isLeader()).toBeTrue();
    cluster.forEach(node => {
      if (node.nodeId !== candidateId) {
        let isFollower = node.isFollower();
        expect(isFollower).toBeTrue();
      }
    });
  });

  it('add log', () => {
    let sendMessage = (receiver: string, message: RaftMessage) => cluster.get(receiver)?.handleMessage(message);
    let expectedLog: Log = {term: 1, content: 'success'};
    let logAppliedCounter = 0;
    let onLog = (log: Log) => {
      expect(log.term).toEqual(expectedLog.term);
      expect(log.content).toEqual(expectedLog.content);
      logAppliedCounter++;
    }
    let observer = new RaftObserverBuilder().sendMessage(sendMessage).onLog(onLog).build();
    let nodeIds = identifier.multiple(4);
    cluster = buildCluster(observer, nodeIds);
    cluster.get(nodeIds[0])?.timeout();
    cluster.get(nodeIds[0])?.command(expectedLog.content);
    cluster.get(nodeIds[0])?.timeout();
    expect(cluster.get(nodeIds[0])?.commitIndex).toEqual(1);
  });

  it('AppendEntriesRequest correct logs partially', () => {
    let sendMessage = (receiver: string, message: RaftMessage) => cluster.get(receiver)?.handleMessage(message);
    let observer = new RaftObserverBuilder().sendMessage(sendMessage).build();
    let correctLog: Log[] = [
      {content: 'A', term: 1},
      {content: 'B', term: 4},
      {content: 'C', term: 5},
      {content: 'D', term: 6}
    ];
    let ids = identifier.multiple(2);
    cluster.set(ids[0], new RaftNode(ids[0], observer,false, correctLog));
    let incorrectLog: Log[] = [
      {content: 'A', term: 1},
      {content: 'E', term: 3},
      {content: 'F', term: 4}
    ];
    cluster.set(ids[1], new RaftNode(ids[1], observer,false, incorrectLog));
    connectCluster(cluster);
    cluster.get(ids[0])?.timeout();
    expect(cluster.get(ids[0])?.allLogs.length).toEqual(correctLog.length);
    expect(cluster.get(ids[0])?.allLogs).toEqual(correctLog);
  });

  it('AppendEntriesRequest correct all logs', () => {
    let sendMessage = (receiver: string, message: RaftMessage) => cluster.get(receiver)?.handleMessage(message);
    let observer = new RaftObserverBuilder().sendMessage(sendMessage).build();
    let correctLog: Log[] = [
      {content: 'A', term: 1},
      {content: 'B', term: 4},
      {content: 'C', term: 5},
      {content: 'D', term: 6}
    ];
    let ids = identifier.multiple(2);
    cluster.set(ids[0], new RaftNode(ids[0], observer,false, correctLog));
    let incorrectLog: Log[] = [
      {content: 'A', term: 2},
      {content: 'E', term: 3},
      {content: 'F', term: 4}
    ];
    cluster.set(ids[1], new RaftNode(ids[1], observer,false, incorrectLog));
    connectCluster(cluster);
    cluster.get(ids[0])?.timeout();
    expect(cluster.get(ids[0])?.allLogs.length).toEqual(correctLog.length);
    expect(cluster.get(ids[0])?.allLogs).toEqual(correctLog);
  });

  it('Append first entry', () => {
    let message: AppendEntriesRequest = {
      term: 1,
      leaderId: identifier.next(),
      prevLogIndex: 0,
      prevLogTerm: undefined,
      entries: [{content: 'payload', term: 1}],
      leaderCommit: 0
    };
    let successCounter = 0;
    let failureCounter = 0;
    let lastLogIndex = 0;
    let sendMessage = (receiver: string, message: RaftMessage) => {
      expect(isAppendEntriesResponse(message)).toBeTrue();
      if (isAppendEntriesResponse(message)) {
        if (message.success) {
          successCounter++;
        } else {
          failureCounter++;
        }
        lastLogIndex = message.lastLogIndex;
      }
    };
    let observer = new RaftObserverBuilder().sendMessage(sendMessage).build();
    let node = new RaftNode(identifier.next(), observer);
    node.handleMessage(message);
    expect(successCounter).toEqual(1);
    expect(failureCounter).toEqual(0);
    expect(lastLogIndex).toEqual(1);
  });
});
