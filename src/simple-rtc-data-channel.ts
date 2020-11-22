import { BehaviorSubject, Observable, Subject } from "rxjs";

/**
 * A handy RTCDataChannel extension to easily subscribe to channel events.
 */
export abstract class SimpleRTCDataChannel extends RTCDataChannel {
  open$: Observable<boolean>;
  message$: Observable<MessageEvent<any>>;
  error$: Observable<RTCErrorEvent>;
  bufferedamountlow$: Observable<Event>;

  static fromRTCDataChannel(dataChannel: RTCDataChannel): SimpleRTCDataChannel {
    // init subjects
    const subjects = {
      open$: new BehaviorSubject(false),
      message$: new Subject<MessageEvent<any>>(),
      error$: new Subject<RTCErrorEvent>(),
      bufferedamountlow$: new Subject<Event>(),
    };

    // connect subjects
    dataChannel.onopen = function (this: RTCDataChannel, ev: Event) {
      subjects.open$.next(true);
    };
    dataChannel.onclose = function (this: RTCDataChannel, ev: Event) {
      subjects.open$.next(false);
    };
    dataChannel.onmessage = function (
      this: RTCDataChannel,
      ev: MessageEvent<any>
    ) {
      subjects.message$.next(ev);
    };
    dataChannel.onerror = function (this: RTCDataChannel, ev: RTCErrorEvent) {
      subjects.error$.next(ev);
    };
    dataChannel.onbufferedamountlow = function (
      this: RTCDataChannel,
      ev: Event
    ) {
      subjects.bufferedamountlow$.next(ev);
    };

    // assign subjects to the original channel
    return Object.assign(dataChannel, {
      open$: subjects.open$.asObservable(),
      message$: subjects.message$.asObservable(),
      error$: subjects.error$.asObservable(),
      bufferedamountlow$: subjects.bufferedamountlow$.asObservable(),
    });
  }
}
