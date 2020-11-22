export abstract class Base extends globalThis.Error {
  constructor(public description: string = "") {
    super(description);
  }
}

export class InitWithDataChannel extends Base {
  constructor(public error: any) {
    super("InitWithDataChannelError");
  }
}

export class InitWithDataChannelAnswer extends Base {
  constructor(public error: any) {
    super("InitWithDataChannelAnswerError");
  }
}

export class Join extends Base {
  constructor(public error: any) {
    super("JoinError");
  }
}
