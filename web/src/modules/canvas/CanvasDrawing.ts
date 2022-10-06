import { EventEmitter } from "../event-emitter";
import { Line, LineDraft } from "../line";
import { PerformanceHelpers } from "../performance";
import { Point } from "../point";

const supportsTouch =
  "ontouchstart" in window || (navigator as any).msMaxTouchPoints;

const NORMALIZED_SIZE = 1000;

const WIDTH = 5;
const WIDTH_MIN = 3;
const WIDTH_MAX = 10;
const WIDTH_TOUCH = 10;

export type CanvasDrawingSettings = {
  id: string;
  color?: string;
};

export interface CanvasDrawingInterface {}

export class CanvasDrawing extends EventEmitter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private currentLine: LineDraft | null = null;
  private boundingClientRect: DOMRect;
  private scale: number = 1;
  private color: string;

  constructor(settings: CanvasDrawingSettings) {
    super();

    this.color = settings.color ?? "#000000";

    this.canvas = document.getElementById(settings.id) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    const parent = this.canvas.parentNode as HTMLElement;
    const size = Math.min(parent.clientWidth, parent.clientHeight);

    this.canvas.width = size;
    this.canvas.height = size;

    this.boundingClientRect = this.canvas.getBoundingClientRect();
    this.scale = size / NORMALIZED_SIZE;

    this.addListeners();
  }

  private addListeners = () => {
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

  private removeListeners = () => {
    if (supportsTouch) {
      this.canvas.removeEventListener("touchstart", this.handleMouseDown);
      this.canvas.removeEventListener("touchend", this.handleMouseUp);
      this.canvas.removeEventListener("touchmove", this.handleMouseMove);
    } else {
      this.canvas.removeEventListener("mousedown", this.handleMouseDown);
      this.canvas.removeEventListener("mouseup", this.handleMouseUp);
      this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    }
  };

  public setColor = (color: string) => {
    this.color = color;
  };

  public destroy = () => {
    this.removeListeners();
  };

  private getPointFromEvent = (event: MouseEvent | TouchEvent): Point => {
    const { left, top } = this.boundingClientRect;

    return event instanceof TouchEvent
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

  private getLineWidth = (point: Point): number => {
    const lineWidth =
      point.force === undefined ? WIDTH : WIDTH_TOUCH * point.force;

    return this.withinRange(lineWidth, WIDTH_MIN, WIDTH_MAX);
  };

  private withinRange = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(min, value), max);
  };

  private handleMouseDown = (event: MouseEvent | TouchEvent) => {
    const startPoint = this.getPointFromEvent(event);

    this.currentLine = {
      color: this.color,
      points: [startPoint],
    };
  };

  private handleMouseUp = () => {
    if (!this.currentLine) {
      return;
    }

    const normalizedLine = this.normalizeLine(this.currentLine);

    this.emit("line", normalizedLine);

    this.currentLine = null;
  };

  private handleMouseMove = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();

    this.mouseMoveThrottled(event);
  };

  private mouseMove = (event: MouseEvent | TouchEvent) => {
    if (!this.currentLine) {
      return;
    }

    const point = this.getPointFromEvent(event);
    const prevPoint =
      this.currentLine.points[this.currentLine.points.length - 1];
    this.currentLine.points.push(point);

    this.drawSegment(prevPoint, point, this.currentLine.color);
  };

  private mouseMoveThrottled = PerformanceHelpers.throttle(this.mouseMove, 20);

  private drawSegment = (start: Point, end: Point, color: string) => {
    const lineWidth = this.denormalizeLineWidth(this.getLineWidth(end));

    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = color;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.stroke();
    this.ctx.closePath();
  };

  // TODO: use quadraticCurveTo
  public drawLine = (line: Line, shouldScale = true) => {
    const scaledLine = shouldScale ? this.denormalizeLine(line) : line;

    const { points, color } = scaledLine;

    this.ctx.strokeStyle = color;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    points.forEach((point, i) => {
      if (i === 0) return;

      const lineWidth = this.denormalizeLineWidth(this.getLineWidth(point));

      this.ctx.lineWidth = lineWidth;
      this.ctx.lineTo(point.x, point.y);
    });

    this.ctx.stroke();
    this.ctx.closePath();
  };

  public drawLines = (lines: Line[]) => {
    lines.forEach((line) => this.drawLine(line));
  };

  public clear = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  private normalizePoint = (point: Point): Point => {
    return { ...point, x: point.x / this.scale, y: point.y / this.scale };
  };

  private denormalizePoint = (point: Point): Point => {
    return { ...point, x: point.x * this.scale, y: point.y * this.scale };
  };

  private normalizeLineWidth = (lineWidth: number): number => {
    return lineWidth / this.scale;
  };

  private denormalizeLineWidth = (lineWidth: number): number => {
    return lineWidth * this.scale;
  };

  private normalizeLine = (line: LineDraft): LineDraft => {
    return {
      ...line,
      points: line.points.map(this.normalizePoint),
    };
  };

  private denormalizeLine = (line: LineDraft) => {
    return {
      ...line,
      points: line.points.map(this.denormalizePoint),
    };
  };
}
