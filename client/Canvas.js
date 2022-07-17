const supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

export class Canvas {
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

  drawLines = (lines) => {
    lines.forEach(this.drawLine);
  };

  onDraw = (subscriber) => {
    this.subscribers.add(subscriber);

    return () => {
      this.subscribers.delete(subscriber);
    };
  };

  clear = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };
}
