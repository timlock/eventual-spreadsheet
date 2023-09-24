import {Message} from "../domain/Message";

export class WebRTCPeer<T> {
  private sendChannel: RTCDataChannel | undefined;
  private receiveChannel: RTCDataChannel | undefined;
  private peer?: RTCPeerConnection;


  constructor(private readonly identifier: string,
              private readonly peerId: string,
              private readonly signalingCallback: (destination: string, payload: any) => void,
              private readonly messageCallback: (message: Message<T>) => void) {
    if (this.identifier < this.peerId) {
      return;
    }
    this.start();
  }

  public handleMessage(message: any) {
    // console.log('Handling message: ', message, ' from: ', this.peerId)
    switch (message.type) {
      case 'offer':
        this.handleOffer(message);
        break;
      case 'answer':
        this.handleAnswer(message);
        break;
      case 'candidate':
        this.handleCandidate(message);
        break;

      case 'bye':
        if (this.peer) {
          this.hangup(message);
        }
        break;
      default:
        console.error('unhandled', message);
        break;
    }
  }

  private onReceive(message: string) {
    // console.log('Received: ', message);
    this.messageCallback(JSON.parse(message))
  }


  private async start() {
    await this.createPeerConnection();
    this.sendChannel = this.peer!.createDataChannel('sendDataChannel');
    this.sendChannel.onopen = (e) => {
      console.log('Channel opened ',this.peerId);
      // this.sendData('Hello from ' + this.identifier)
    }
    this.sendChannel.onmessage = (e) => this.onReceive(e.data);
    this.sendChannel.onclose = (e) => console.log('Channel closed ',this.peerId);


    const offer = await this.peer!.createOffer();
    // this.signaling.postMessage({type: 'offer', sdp: offer.sdp, source: this.identifier});
    this.signalingCallback(this.peerId, {type: 'offer', sdp: offer.sdp, source: this.identifier})
    await this.peer!.setLocalDescription(offer);
  };

  async closeChannel(source: string) {
    this.hangup(source);
    // this.signaling.postMessage({type: 'bye', source: this.identifier});
    this.signalingCallback(this.peerId, {type: 'bye', source: this.identifier})
  };

  private async hangup(source: string) {
    if (this.peer) {
      this.peer.close();
      this.peer = undefined
    }
    this.sendChannel = undefined;
    this.receiveChannel = undefined;
    console.log('Closed peer connections',this.peerId);
  };

  private async createPeerConnection() {
    this.peer = new RTCPeerConnection();
    this.peer.onicecandidate = e => {
      const message: {
        type: string,
        source: string,
        candidate: string | null,
        sdpMid: string | null,
        sdpMLineIndex: number | null
      } = {
        sdpMLineIndex: null,
        sdpMid: null,
        type: 'candidate',
        candidate: null,
        source: this.identifier
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      this.signalingCallback(this.peerId, message)
    };
    console.log('Created peerConnection for: ', this.peerId)
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    if (this.peer) {
      console.error('existing peerconnection',this.peerId);
      return;
    }
    await this.createPeerConnection();
    // if (this.peer === undefined) {
    //   console.error('PC not created');
    //   return
    // }
    this.peer!.ondatachannel = (ev) => {
      this.receiveChannelCallback(ev);
      // this.sendData('Hello from back from ' + this.identifier)
    };
    await this.peer!.setRemoteDescription(offer);

    const answer = await this.peer!.createAnswer();
    // this.signaling.postMessage({type: 'answer', sdp: answer.sdp, source: this.identifier});
    this.signalingCallback(this.peerId, {type: 'answer', sdp: answer.sdp, source: this.identifier})
    await this.peer!.setLocalDescription(answer);
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peer) {
      console.error('no peerconnection ',this.peerId);
      return;
    }
    await this.peer.setRemoteDescription(answer);
  }

  private async handleCandidate(candidate: RTCIceCandidateInit) {
    if (this.peer === undefined) {
      console.error('no peerconnection ',this.peerId);
      return;
    }
    if (!candidate.candidate) {
      await this.peer.addIceCandidate(null!);
    } else {
      await this.peer.addIceCandidate(candidate);
    }
  }

  public sendData(data: string) {
    // console.log('Send: ', data)
    if (this.sendChannel) {
      this.sendChannel.send(data);
    } else {
      this.receiveChannel!.send(data);
    }
  }


  private receiveChannelCallback(event: RTCDataChannelEvent) {
    // console.log('Receive Channel Callback: ', event.channel);
    this.receiveChannel = event.channel;
    this.receiveChannel.onmessage = (e) => this.onReceive(e.data);
    this.receiveChannel.onopen = (e) => console.log('Channel opened',this.peerId);
    this.receiveChannel.onclose = (e) => console.log('Channel closed',this.peerId);
  }


}
