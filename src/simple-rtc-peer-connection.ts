import { Subject } from "rxjs";
import { take } from "rxjs/operators";
import { SimpleRTCDataChannel, SRTCPCError, SRTCPCInfo } from ".";

/**
 * A handy RTCPeerConnection extension to easily create a connection between two peers
 * and to easily subscribe to its events.
 * @example
 * ```
const aaa = new SimpleRTCPeerConnection();
const bbb = new SimpleRTCPeerConnection();

aaa.dataChannel$.subscribe(dataChannel=>{
  dataChannel.message$.subscribe(message=>{
    console.log('aaa received', message.data);
    dataChannel.send('message from aaa: pong')
  })
})

bbb.dataChannel$.subscribe(dataChannel=>{
  dataChannel.message$.subscribe(message=>{
    console.log('bbb received', message.data)
  })

  dataChannel.open$.subscribe(open=>{
    if(open){
      dataChannel.send('message from bbb: ping')
    }
  })
})

// hand shake:
aaa.initWithDataChannel('abc').then(({
  offer, setAnswer
})=>{
  return bbb.join(offer).then(({answer})=>{
    setAnswer(answer)
  })
}).catch();

 * ```
 */
export class SimpleRTCPeerConnection extends RTCPeerConnection {
  private lasticecandidateSubject$ = new Subject<void>();

  private dataChannelSubject$ = new Subject<SimpleRTCDataChannel>();
  private errorSubject$ = new Subject<SRTCPCError.Base>();
  private infoSubject$ = new Subject<SRTCPCInfo.Base>();

  readonly dataChannel$ = this.dataChannelSubject$.asObservable();
  readonly error$ = this.errorSubject$.asObservable();
  readonly info$ = this.infoSubject$.asObservable();

  constructor(
    configuration: RTCConfiguration = {
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
      ],
    }
  ) {
    super(configuration);
  }

  onicecandidate = function (
    this: SimpleRTCPeerConnection,
    ev: RTCPeerConnectionIceEvent
  ) {
    if (ev.candidate != null) {
      this.infoSubject$.next(new SRTCPCInfo.NewIceCandidate());
    } else {
      this.infoSubject$.next(new SRTCPCInfo.NewIceCandidate());
      this.lasticecandidateSubject$.next(void 0);
    }
  };

  onconnectionstatechange = function (
    this: SimpleRTCPeerConnection,
    ev: Event
  ) {
    this.infoSubject$.next(new SRTCPCInfo.ConnectionStateChange(ev));
  };

  oniceconnectionstatechange = function (
    this: SimpleRTCPeerConnection,
    ev: Event
  ) {
    this.infoSubject$.next(new SRTCPCInfo.IceConnectionStateChange(ev));
  };

  ondatachannel = function (
    this: SimpleRTCPeerConnection,
    ev: RTCDataChannelEvent
  ) {
    const dataChannel = SimpleRTCDataChannel.fromRTCDataChannel(ev.channel);
    this.dataChannelSubject$.next(dataChannel);
  };

  /**
   * Initialize a RTCPeerConnection handshake
   */
  initWithDataChannel = function (
    this: SimpleRTCPeerConnection,
    dataChannelLabel: string,
    dataChannelDict?: RTCDataChannelInit
  ) {
    const dataChannel = this.createDataChannel(
      dataChannelLabel,
      dataChannelDict
    );
    this.dataChannelSubject$.next(
      SimpleRTCDataChannel.fromRTCDataChannel(dataChannel)
    );

    return this.createOffer()
      .then((offer) => {
        return this.setLocalDescription(offer);
      })
      .then(() => {
        this.lasticecandidateSubject$.pipe(take(1)).toPromise(); // wait for last ice candidate
      })
      .then(() => {
        return {
          /**
           * The offer for the remote/joining party
           */
          offer: this.localDescription,
          /**
           * Callback with the answer from the remote party
           */
          setAnswer: (answer: RTCSessionDescription) => {
            return this.setRemoteDescription(answer)
              .then()
              .catch((err) => {
                this.errorSubject$.next(
                  new SRTCPCError.InitWithDataChannelAnswer(err)
                );
                throw err;
              });
          },
        };
      })
      .catch((err) => {
        this.errorSubject$.next(new SRTCPCError.InitWithDataChannel(err));
        throw err;
      });
  };

  /**
   * Join a RTCPeerConnection handshake initialized by a remote party
   */
  join = function (
    this: SimpleRTCPeerConnection,
    offer: RTCSessionDescription
  ) {
    return this.setRemoteDescription(offer)
      .then(() => {
        return this.createAnswer();
      })
      .then((answer) => {
        this.setLocalDescription(answer);
      })
      .then(() => {
        return this.lasticecandidateSubject$.pipe(take(1)).toPromise(); // wait for last ice candidate
      })
      .then(() => {
        return {
          /**
           * The offer for the remote/initializing party
           */
          answer: this.localDescription,
        };
      })
      .catch((err) => {
        this.errorSubject$.next(new SRTCPCError.Join(err));
        throw err;
      });
  };
}
