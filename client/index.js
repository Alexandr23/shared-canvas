var supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

const isSecure = location.protocol.includes("https");
const wsProtocol = isSecure ? "wss" : "ws";
const wsHost = window.location.host;
const wsPort = 9000;
const wsUrl = `${wsProtocol}://${wsHost}`;

const MESSAGE_TYPE = {
  INIT: "init",
  DRAW: "draw",
  CLEAR: "clear",
};

class Canvas {
  constructor() {
    this.canvas = document.getElementById("shared-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.lineWidth = 5;
    this.strokeStyle = "#ff1b41";
    this.subscribers = new Set();

    this.currPoint = null;

    this.adjustSize();
  }

  init({ color }) {
    this.color = color;

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
    const line = { start: this.currPoint, end: point, color: this.color };

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

  drawLine = ({ start, end, color }) => {
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = color;
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

class App {
  constructor() {
    this.user = null;
  }

  init = () => {
    this.canvas = new Canvas();
    this.canvas.onDraw(this.handleDraw);

    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener("message", this.handleWsMessage);

    // this.buttonClear = document.getElementById('button-clear')
    // this.buttonClear.addEventListener('click', )
  };

  handleWsMessage = (event) => {
    console.log(event);

    const message = JSON.parse(event.data);

    if (message.type === MESSAGE_TYPE.INIT) {
      this.user = message.user;

      this.canvas.init({ color: message.user.color });

      Object.values(message.data.lines).forEach((lines) => {
        lines.forEach((line) => {
          this.canvas.drawLine(line);
        });
      });
    } else if (message.type === MESSAGE_TYPE.DRAW) {
      this.canvas.drawLine(message.line);
    }
  };

  handleDraw = (line) => {
    this.ws.send(
      JSON.stringify({ type: MESSAGE_TYPE.DRAW, userId: this.user.id, line })
    );
  };

  // handleButtonClearClick = () => {
  //   this.ws.send(
  //     JSON.stringify({ type: MESSAGE_TYPE.CLEAR, userId: this.user.id, line })
  //   );
  // }
}

window.addEventListener("load", function () {
  const app = new App();
  app.init();
});
