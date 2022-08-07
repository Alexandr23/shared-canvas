import { COLOR_SELECTION_EVENT } from "./Events.js";

const supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

const NORMALIZED_SIZE = 1000;
const WIDTH = 5;

export class Canvas {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;

    this.canvas = document.getElementById("shared-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.subscribers = new Set();

    this.currPoint = null;
    this.boundingClientRect = null;
    this.scale = 1;

    this.adjustSize();
  }

  init({ color }) {
    this.color = color;

    this.addListeners();
  }

  addListeners = () => {
    this.eventEmitter.on(COLOR_SELECTION_EVENT, this.handleColorSelection);

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

  handleColorSelection = ({ color }) => {
    this.color = color;
  };

  getPointFromEvent = (event) => {
    const { left, top } = this.boundingClientRect;

    return supportsTouch
      ? {
          x: event.touches[0]?.pageX - left,
          y: event.touches[0]?.pageY - top,
        }
      : {
          x: event.x - left,
          y: event.y - top,
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
    const normalizedLine = this.normalizeLine(line);

    this.currPoint = point;

    this.drawLine(line, false);

    this.subscribers.forEach((subscriber) => {
      subscriber(normalizedLine);
    });
  };

  adjustSize = () => {
    const parent = this.canvas.parentNode;
    const size = Math.min(parent.clientWidth, parent.clientHeight);

    this.canvas.width = size;
    this.canvas.height = size;

    this.boundingClientRect = this.canvas.getBoundingClientRect();
    this.scale = size / NORMALIZED_SIZE;
  };

  drawLine = (line, shouldScale = true) => {
    const scaledLine = shouldScale ? this.denormalizeLine(line) : line;
    const width = WIDTH * this.scale;

    const { start, end, color } = scaledLine;

    this.ctx.lineWidth = width;
    this.ctx.strokeStyle = color;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
  };

  drawLines = (lines) => {
    lines.forEach((line) => this.drawLine(line));
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

  normalizePoint = (point) => {
    return { x: point.x / this.scale, y: point.y / this.scale };
  };

  denormalizePoint = (point) => {
    return { x: point.x * this.scale, y: point.y * this.scale };
  };

  normalizeLine = (line) => {
    return {
      ...line,
      start: this.normalizePoint(line.start),
      end: this.normalizePoint(line.end),
    };
  };

  denormalizeLine = (line) => {
    return {
      ...line,
      start: this.denormalizePoint(line.start),
      end: this.denormalizePoint(line.end),
    };
  };
}
