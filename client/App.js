import { EventEmitter } from "./EventEmitter.js";
import {
  INIT_EVENT,
  USERS_UPDATE_EVENT,
  COLOR_SELECTION_EVENT,
} from "./Events.js";
import { Canvas } from "./Canvas.js";
import { ColorSelection } from "./ColorSelection.js";
import { Users } from "./Users.js";

const isSecure = location.protocol.includes("https");
const wsProtocol = isSecure ? "wss" : "ws";
const wsHost = window.location.host;
const wsPort = 9000;
const wsUrl = `${wsProtocol}://${wsHost}`;

const WS_MESSAGE_TYPE = {
  READY: "ready",
  INIT: "init",
  DRAW: "draw",
  CLEAR: "clear",
  CLEAR_ALL: "clear-all",
  USERS: "users",
  COLOR_SELECTION: "color-selection",
  PUSH_SUBSCRIPTION: "push-subscription",
  NOTIFY: "notify",
};

const SHARED_CANVAS_USER = "SHARED_CANVAS_USER";

export class App {
  constructor() {
    this.user = null;
    this.lines = [];

    this.VAPID_PUBLIC_KEY = null;

    this.isReady = false;
    this.isInitialized = false;
  }

  init = () => {
    this.eventEmitter = new EventEmitter();

    this.canvas = new Canvas(this.eventEmitter);
    this.canvas.onDraw(this.handleDraw);

    this.colorSelection = new ColorSelection(this.eventEmitter);

    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener("open", this.handleWsOpen);
    this.ws.addEventListener("message", this.handleWsMessage);

    this.users = new Users(this.eventEmitter);

    // DOM
    this.buttonClear = document.getElementById("button-clear");
    this.buttonClear?.addEventListener("click", this.handleButtonClearClick);

    this.buttonSelectColor = document.getElementById("button-select-color");
    this.buttonSelectColor?.addEventListener(
      "click",
      this.handleButtonSelectColorClick
    );

    this.buttonClearAll = document.getElementById("button-clear-all");
    this.buttonClearAll?.addEventListener(
      "click",
      this.handleButtonClearAllClick
    );

    this.buttonDownload = document.getElementById("button-download");
    this.buttonDownload?.addEventListener(
      "click",
      this.handleButtonDownloadClick
    );

    this.buttonNotify = document.getElementById("button-notify");
    this.buttonNotify?.addEventListener("click", this.handleButtonNotifyClick);

    this.eventEmitter.on(COLOR_SELECTION_EVENT, this.handleColorSelection);
  };

  initPushNotifications = async () => {
    await this.requestPushNotificationPermission();
    await this.registerServiceWorker();
  };

  registerServiceWorker = () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("ServiceWorker or/and PushManager is not supported");
      return;
    }

    return navigator.serviceWorker
      .register("/client/service-worker.js")
      .then((registration) => {
        console.log("Service worker successfully registered.");

        this.subscribeForPushNotifications(registration);

        return registration;
      })
      .catch((err) => {
        console.error("Unable to register service worker.", err);
      });
  };

  requestPushNotificationPermission = () => {
    return new Promise((resolve, reject) => {
      const permissionResult = Notification.requestPermission((result) => {
        resolve(result);
      });

      if (permissionResult) {
        permissionResult.then(resolve, reject);
      }
    }).then((permissionResult) => {
      if (permissionResult !== "granted") {
        throw new Error("We weren't granted permission.");
      }
    });
  };

  subscribeForPushNotifications = (registration) => {
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: this.VAPID_PUBLIC_KEY,
    };

    return registration.pushManager.subscribe(subscribeOptions).then((ps) => {
      const pushSubscription = JSON.parse(JSON.stringify(ps));

      console.log("Received PushSubscription: ", pushSubscription);

      this.ws.send(
        JSON.stringify({
          type: WS_MESSAGE_TYPE.PUSH_SUBSCRIPTION,
          pushSubscription: {
            ...pushSubscription,
            userId: this.user.id,
          },
        })
      );

      return pushSubscription;
    });
  };

  handleWsOpen = () => {
    this.isReady = true;
    const user = JSON.parse(localStorage.getItem(SHARED_CANVAS_USER));
    this.ws.send(JSON.stringify({ type: WS_MESSAGE_TYPE.READY, user }));
  };

  handleWsMessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === WS_MESSAGE_TYPE.INIT) {
      this.handleWsMessageInit(message);
      this.isInitialized = true;
      return;
    }

    if (!this.isInitialized) {
      return;
    }

    if (message.type === WS_MESSAGE_TYPE.DRAW) {
      this.handleWsMessageDraw(message);
    } else if (message.type === WS_MESSAGE_TYPE.CLEAR) {
      this.handleWsMessageClear(message);
    } else if (message.type === WS_MESSAGE_TYPE.CLEAR_ALL) {
      this.handleWsMessageClearAll(message);
    } else if (message.type === WS_MESSAGE_TYPE.USERS) {
      this.handleWsMessageUsers(message);
    } else if (message.type === WS_MESSAGE_TYPE.COLOR_SELECTION) {
      this.handleWsMessageColorSelection(message);
    }
  };

  handleDraw = (line) => {
    this.lines.push(line);

    this.ws.send(JSON.stringify({ type: WS_MESSAGE_TYPE.DRAW, line }));
  };

  handleButtonNotifyClick = () => {
    this.ws.send(
      JSON.stringify({ type: WS_MESSAGE_TYPE.NOTIFY, data: "Whazzzzup!" })
    );
  };

  handleButtonClearClick = () => {
    this.clear(this.user.id);

    this.ws.send(
      JSON.stringify({ type: WS_MESSAGE_TYPE.CLEAR, userId: this.user.id })
    );
  };

  handleButtonClearAllClick = () => {
    this.clearAll();

    this.ws.send(
      JSON.stringify({ type: WS_MESSAGE_TYPE.CLEAR_ALL, userId: this.user.id })
    );
  };

  handleButtonDownloadClick = () => {
    const image = this.canvas.canvas
      .toDataURL("image/png", 1.0)
      .replace("image/png", "image/octet-stream");
    const link = document.createElement("a");
    link.download = "shared-canvas.png";
    link.href = image;
    link.click();
    link.remove();
  };

  handleButtonSelectColorClick = () => {
    this.colorSelection.open();
  };

  handleWsMessageInit = (message) => {
    this.user = message.user;
    this.lines = message.lines;
    this.VAPID_PUBLIC_KEY = message.VAPID_PUBLIC_KEY;

    localStorage.setItem(SHARED_CANVAS_USER, JSON.stringify(message.user));

    this.canvas.init({ user: message.user });
    this.canvas.drawLines(this.lines);

    this.eventEmitter.emit(INIT_EVENT, message);

    if (message.hasPushSubscription) {
      console.log("already has PushSubscription");
    } else {
      this.initPushNotifications();
    }
  };

  handleWsMessageDraw = (message) => {
    this.lines.push(message.line);

    this.canvas.drawLine(message.line);
  };

  handleWsMessageClear = (message) => {
    this.clear(message.userId);
  };

  handleWsMessageClearAll = () => {
    this.clearAll();
  };

  handleWsMessageUsers = (message) => {
    this.eventEmitter.emit(USERS_UPDATE_EVENT, message.users);
  };

  handleWsMessageColorSelection = (message) => {
    this.users.updateUserColor(message);
  };

  clear = (userId) => {
    this.lines = this.lines.filter((line) => line.userId !== userId);

    this.canvas.clear();
    this.canvas.drawLines(this.lines);
  };

  clearAll = () => {
    this.lines = [];

    this.canvas.clear();
  };

  handleColorSelection = ({ color }) => {
    this.ws.send(
      JSON.stringify({
        type: WS_MESSAGE_TYPE.COLOR_SELECTION,
        userId: this.user.id,
        color,
      })
    );
  };
}
