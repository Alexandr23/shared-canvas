var supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

const isSecure = location.protocol.includes("https");
const wsProtocol = isSecure ? "wss" : "ws";
const wsHost = window.location.host;
const wsPort = 9000;
const wsUrl = `${wsProtocol}://${wsHost}`;

class Canvas {
  constructor() {
    this.canvas = document.getElementById("shared-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.lineWidth = 5;
    this.strokeStyle = "#ff1b41";
    this.subscribers = new Set();

    this.currPoint = null;

    this.adjustSize();
    this.addListeners();
  }

  addListeners = () => {
    if (supportsTouch) {
      this.canvas.addEventListener("touchstart", this.handleMouseDown);
      this.canvas.addEventListener("touchend", this.handleMouseUp);
      this.canvas.addEventListener("touchmove", this.handleMouseMove);
    } else {
      this.canvas.addEventListener("mousedown", this.handleMouseDown);
      this.canvas.addEventListener("mouseup", this.handleMouseUp);
      this.canvas.addEventListener("mousemove", this.handleMouseMove);
    }
  };

  getPointFromEvent = (event) => {
    return supportsTouch
      ? {
          x: event.touches[0]?.pageX,
          y: event.touches[0]?.pageY,
        }
      : {
          x: event.x,
          y: event.y,
        };
  };

  handleMouseDown = (event) => {
    this.currPoint = this.getPointFromEvent(event);
  };

  handleMouseUp = () => {
    this.currPoint = null;
  };

  handleMouseMove = (event) => {
    event.preventDefault();

    if (!this.currPoint) {
      return;
    }

    const point = this.getPointFromEvent(event);
    const line = { start: this.currPoint, end: point };

    this.currPoint = point;

    this.drawLine(line);

    this.subscribers.forEach((subscriber) => {
      subscriber(line);
    });
  };

  adjustSize = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  drawLine = ({ start, end }) => {
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
  };

  onDraw = (subscriber) => {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  };
}

const start = () => {
  const canvas = new Canvas();

  const ws = new WebSocket(wsUrl);

  ws.addEventListener("message", (event) => {
    console.log(event);

    const line = JSON.parse(event.data);

    canvas.drawLine(line);
  });

  canvas.onDraw((point) => {
    ws.send(JSON.stringify(point));
  });
};

window.addEventListener("load", function () {
  start();
});
