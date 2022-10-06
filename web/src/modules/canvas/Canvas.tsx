import React from "react";

import { useStore } from "../store";
import { LineDraft } from "../line";

import { CanvasDrawing } from "./CanvasDrawing";

import styles from "./Canvas.module.css";

type CanvasProps = {};

const ID = "shared-canvas";

export const Canvas: React.FC<CanvasProps> = () => {
  const createLine = useStore((state) => state.createLine);
  const color = useStore((state) => state.user?.color);
  const lines = useStore((state) => state.lines);
  const canvasDrawingRef = React.useRef<CanvasDrawing | null>(null);

  const handleLine = React.useCallback(
    async (line: LineDraft) => {
      await createLine(line);
    },
    [createLine]
  );

  React.useEffect(() => {
    const canvasDrawing = canvasDrawingRef.current;

    if (canvasDrawing) {
      canvasDrawing.clear();
      canvasDrawing.drawLines(lines);
    }
  }, [lines]);

  React.useEffect(() => {
    const canvasDrawing = new CanvasDrawing({ id: ID });
    canvasDrawing.on("line", handleLine);
    canvasDrawingRef.current = canvasDrawing;

    return () => {
      canvasDrawing.destroy();
    };
  }, [handleLine]);

  React.useEffect(() => {
    const canvasDrawing = canvasDrawingRef.current;
    if (!canvasDrawing || !color) return;
    canvasDrawing.setColor(color);
  }, [color]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.box}>
        <canvas className={styles.canvas} id={ID}></canvas>
      </div>
    </div>
  );
};
