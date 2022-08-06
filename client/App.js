import { Canvas } from "./Canvas.js";
import { ColorSelection } from "./ColorSelection.js";
import { EventEmitter } from "./EventEmitter.js";

const isSecure = location.protocol.includes("https");
const wsProtocol = isSecure ? "wss" : "ws";
const wsHost = window.location.host;
const wsPort = 9000;
const wsUrl = `${wsProtocol}://${wsHost}`;

const MESSAGE_TYPE = {
  INIT: "init",
  DRAW: "draw",
  CLEAR: "clear",
  CLEAR_ALL: "clear-all",
};

export class App {
  constructor() {
    this.user = null;
    this.data = null;
  }

  init = () => {
    this.eventEmitter = new EventEmitter();

    this.canvas = new Canvas(this.eventEmitter);
    this.canvas.onDraw(this.handleDraw);

    this.colorSelection = new ColorSelection(this.eventEmitter);

    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener("message", this.handleWsMessage);

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
  };

  handleWsMessage = (event) => {
    // console.log(event);

    const message = JSON.parse(event.data);

    if (message.type === MESSAGE_TYPE.INIT) {
      this.handleWsMessageInit(message);
    } else if (message.type === MESSAGE_TYPE.DRAW) {
      this.handleWsMessageDraw(message);
    } else if (message.type === MESSAGE_TYPE.CLEAR) {
      this.handleWsMessageClear(message);
    } else if (message.type === MESSAGE_TYPE.CLEAR_ALL) {
      this.handleWsMessageClearAll(message);
    }
  };

  handleDraw = (line) => {
    this.data.lines[this.user.id] = this.data.lines[this.user.id] ?? [];
    this.data.lines[this.user.id].push(line);

    this.ws.send(
      JSON.stringify({ type: MESSAGE_TYPE.DRAW, userId: this.user.id, line })
    );
  };

  handleButtonClearClick = () => {
    this.clear(this.user.id);

    this.ws.send(
      JSON.stringify({ type: MESSAGE_TYPE.CLEAR, userId: this.user.id })
    );
  };

  handleButtonClearAllClick = () => {
    this.clearAll();

    this.ws.send(
      JSON.stringify({ type: MESSAGE_TYPE.CLEAR_ALL, userId: this.user.id })
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
    this.data = message.data;

    this.canvas.init({ color: message.user.color });

    Object.values(message.data.lines).forEach((lines) => {
      this.canvas.drawLines(lines);
    });
  };

  handleWsMessageDraw = (message) => {
    this.data.lines[message.userId] = this.data.lines[message.userId] ?? [];
    this.data.lines[message.userId].push(message.line);

    this.canvas.drawLine(message.line);
  };

  handleWsMessageClear = (message) => {
    this.clear(message.userId);
  };

  handleWsMessageClearAll = () => {
    this.clearAll();
  };

  clear = (userId) => {
    this.data.lines[userId] = [];

    this.canvas.clear();
    Object.values(this.data.lines).forEach((lines) => {
      this.canvas.drawLines(lines);
    });
  };

  clearAll = () => {
    this.data.lines = {};

    this.canvas.clear();
  };
}
