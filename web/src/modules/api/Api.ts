import { v4 as uuid } from "uuid";

import { EventEmitter } from "../event-emitter";
import { WebSocketClient } from "../web-socket";

const REQUEST_TIMEOUT = 5000;

export type ApiMessage<Type> = {
  type: Type;
  data?: any;
};

export enum ApiRequestType {
  Init = "Init",
  CreateLine = "CreateLine",
  Undo = "Undo",
  Clear = "Clear",
  ClearAll = "ClearAll",
  SelectColor = "SelectColor",
}

export enum ApiEventType {
  Users = "Users",
  User = "User",
  LineCreated = "LineCreated",
  LineRemoved = "LineRemoved",
  Cleared = "Cleared",
  ClearedAll = "ClearedAll",
}

type WithId = {
  id: string;
};

export type ApiRequest = ApiMessage<ApiRequestType> & WithId;
export type ApiResponse = ApiMessage<ApiRequestType> & WithId;
export type ApiEvent = ApiMessage<ApiEventType>;

type ApiSettings = {
  url: string;
};

// Request
// Response
// Event

export class Api extends EventEmitter {
  private webSocketClient: WebSocketClient;

  private timers: Record<string, number> = {};

  private resolves: Record<string, (value: unknown) => void> = {};

  constructor(settings: ApiSettings) {
    super();

    this.webSocketClient = new WebSocketClient({ url: settings.url });

    this.webSocketClient.on(this.handleWsMessage);
  }

  private getIsResponse = (message: any): message is ApiResponse => {
    return typeof message === "object" && "id" in message;
  };

  private handleWsMessage = (message: any) => {
    if (this.getIsResponse(message)) {
      this.handleResponse(message);
    } else {
      this.handleEvent(message as ApiEvent);
    }
  };

  private handleResponse = (message: ApiResponse) => {
    const requestId = message.id;

    const timer = this.timers[requestId];
    const resolve = this.resolves[requestId];

    if (timer && resolve) {
      clearTimeout(timer);
      resolve(message);

      //   delete this.timers[requestId];
      delete this.resolves[requestId];
    }
  };

  private handleEvent = (message: ApiEvent) => {
    this.emit(message.type, message);
  };

  public request = async (type: ApiRequestType, data?: any): Promise<any> => {
    const requestId = uuid();

    const message = {
      id: requestId,
      type,
      data,
    };

    this.webSocketClient.send(message);

    const promise = new Promise((resolve, reject) => {
      this.resolves[requestId] = resolve;

      this.timers[requestId] = window.setTimeout(() => {
        const error = new Error("Request Timeout");
        reject(error);

        // delete this.timers[requestId]
      }, REQUEST_TIMEOUT);
    });

    return promise;
  };
}

const isSecure = location.protocol.includes("https");
const wsProtocol = isSecure ? "wss" : "ws";
const wsHost = window.location.host;
const wsUrl = `${wsProtocol}://${wsHost}`;

export const api = new Api({ url: wsUrl });
