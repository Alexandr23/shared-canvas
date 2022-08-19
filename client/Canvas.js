import { COLOR_SELECTION_EVENT } from "./Events.js";

const supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;

const NORMALIZED_SIZE = 1000;

const WIDTH = 5;
const WIDTH_MIN = 3;
const WIDTH_MAX = 10;
const WIDTH_TOUCH = 10;

const throttle = (fn, wait) => {
  let inThrottle, lastFn, lastTime;
  return function () {
    const context = this,
      args = arguments;
    if (!inThrottle) {
      fn.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);
      lastFn = setTimeout(function () {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
};

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

  init({ user }) {
    this.user = user;
    this.color = user.color;

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
          force: event.touches[0].force,
        }
      : {
          x: event.x - left,
          y: event.y - top,
        };
  };

  getLineWidth = (point) => {
    const lineWidth =
      point.force === undefined ? WIDTH : WIDTH_TOUCH * point.force;

      console.log(lineWidth);

    return this.withinRange(lineWidth, WIDTH_MIN, WIDTH_MAX);
  };

  withinRange = (value, min, max) => {
    return Math.min(Math.max(min, value), max);
  };

  handleMouseDown = (event) => {
    this.currPoint = this.getPointFromEvent(event);
  };

  handleMouseUp = () => {
    this.currPoint = null;
  };

  handleMouseMove = (event) => {
    event.preventDefault();

    this.mouseMoveThrottled(event);
  };

  mouseMove = (event) => {
    console.log(event);

    if (!this.currPoint) {
      return;
    }

    const point = this.getPointFromEvent(event);
    const line = {
      userId: this.user.id,
      start: this.currPoint,
      end: point,
      color: this.color,
      lineWidth: this.getLineWidth(point),
    };
    const normalizedLine = this.normalizeLine(line);

    this.currPoint = point;

    this.drawLine(line, false);

    this.subscribers.forEach((subscriber) => {
      subscriber(normalizedLine);
    });
  };

  mouseMoveThrottled = throttle(this.mouseMove, 20);

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

    const { start, end, color, lineWidth } = scaledLine;

    this.ctx.lineWidth = lineWidth;
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

  normalizeLineWidth = (lineWidth) => {
    return lineWidth / this.scale;
  };

  denormalizeLineWidth = (lineWidth) => {
    return lineWidth * this.scale;
  };

  normalizeLine = (line) => {
    return {
      ...line,
      start: this.normalizePoint(line.start),
      end: this.normalizePoint(line.end),
      lineWidth: this.normalizeLineWidth(line.lineWidth),
    };
  };

  denormalizeLine = (line) => {
    return {
      ...line,
      start: this.denormalizePoint(line.start),
      end: this.denormalizePoint(line.end),
      lineWidth: this.denormalizeLineWidth(line.lineWidth),
    };
  };
}
