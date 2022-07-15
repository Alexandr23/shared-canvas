var supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

const isSecure = location.protocol.includes("https");
const wsProtocol = isSecure ? "wss" : "ws";
const wsHost = window.location.host;
const wsPort = 9000;
const wsUrl = `${wsProtocol}://${wsHost}:${wsPort}`;

class Canvas {
  constructor() {
    this.canvas = document.getElementById("shared-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.size = 5;
    this.isDrawing = false;
    this.subscribers = new Set();

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
    this.isDrawing = true;

    const point = this.getPointFromEvent(event);

    this.drawPoint(point);

    this.subscribers.forEach((subscriber) => {
      subscriber(point);
    });
  };

  handleMouseUp = () => {
    this.isDrawing = false;
  };

  handleMouseMove = (event) => {
    if (!this.isDrawing) {
      return;
    }

    const point = this.getPointFromEvent(event);

    this.drawPoint(point);

    this.subscribers.forEach((subscriber) => {
      subscriber(point);
    });

    event.preventDefault();
  };

  adjustSize = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  };

  drawPoint = ({ x, y }) => {
    this.ctx.fillStyle = "#ff1b41";
    this.ctx.fillRect(
      x - this.size / 2,
      y - this.size / 2,
      this.size,
      this.size
    );
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

    const point = JSON.parse(event.data);

    canvas.drawPoint(point);
  });

  canvas.onDraw((point) => {
    ws.send(JSON.stringify(point));
  });
};

window.addEventListener("load", function () {
  start();
});
