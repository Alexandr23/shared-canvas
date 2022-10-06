export type Listener = (data: any) => void;

export class EventEmitter {
  private _events: Record<string, Listener[]>;

  constructor() {
    this._events = {};
  }

  public on = (name: string, listener: Listener) => {
    if (!this._events[name]) {
      this._events[name] = [];
    }

    this._events[name].push(listener);
  };

  public off = (name: string, listenerToRemove: Listener) => {
    if (!this._events[name]) {
      throw new Error(
        `Can't remove a listener. Event "${name}" doesn't exits.`
      );
    }

    this._events[name] = this._events[name].filter(
      (listener: Listener) => listener !== listenerToRemove
    );
  };

  public emit = (name: string, data: any) => {
    if (!this._events[name]) {
      return;
    }

    this._events[name].forEach((listener) => {
      listener(data);
    });
  };
}
