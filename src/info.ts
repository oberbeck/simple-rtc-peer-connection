export abstract class Base {
  description: string;
}

export class NewIceCandidate extends Base {
  description = "new ice candidate";
}

export class AllIceCandidates extends Base {
  description = "all ice candidates";
}

export class ConnectionStateChange extends Base {
  description = "connection state change";
  constructor(public event: Event) {
    super();
  }
}

export class IceConnectionStateChange extends Base {
  description = "ICE connection state change";
  constructor(public event: Event) {
    super();
  }
}
