import { EventEmitter, Listener } from "../event-emitter";

export type WebSocketClientSettings = {
  url: string;
};

export class WebSocketClient {
  private ws: WebSocket;

  private isReady: boolean = false;

  private eventEmitter: EventEmitter;

  private queue: object[] = [];

  constructor(settings: WebSocketClientSettings) {
    this.ws = new WebSocket(settings.url);

    this.ws.addEventListener("open", this.handleWsOpen);
    this.ws.addEventListener("message", this.handleWsMessage);

    this.eventEmitter = new EventEmitter();
  }

  private handleWsOpen = () => {
    this.isReady = true;

    this.queue.forEach((message) => {
      this.send(message);
    });

    this.queue = [];
  };

  private handleWsMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);

    this.eventEmitter.emit("message", message);
  };

  public send = (message: object) => {
    if (!this.isReady) {
      this.queue.push(message);
      console.log("WebSocketClient: not yet ready to send messages", message);
      return;
    }

    const data = JSON.stringify(message);

    this.ws.send(data);
  };

  public on = (listener: Listener) => {
    this.eventEmitter.on("message", listener);
  };

  public off = (listener: Listener) => {
    this.eventEmitter.off("message", listener);
  };
}
