import React from "react";

import { useStore } from "../store";
import { ColorSelection } from "../color-selection";

import styles from "./Footer.module.css";

type FooterProps = {};

export const Footer: React.FC<FooterProps> = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.buttons}>
        <Undo />
        <Clear />
        <ClearAll />
        <Download />
        <ColorSelection />
      </div>
    </div>
  );
};

const Clear = () => {
  const clear = useStore((state) => state.clear);

  const handleClick = React.useCallback(async () => {
    await clear();
  }, [clear]);

  return <button onClick={handleClick}>Clear</button>;
};

const ClearAll = () => {
  const clearAll = useStore((state) => state.clearAll);

  const handleClick = React.useCallback(async () => {
    await clearAll();
  }, [clearAll]);

  return <button onClick={handleClick}>Clear All</button>;
};

const Undo = () => {
  const undo = useStore((state) => state.undo);

  const handleClick = React.useCallback(async () => {
    await undo();
  }, [undo]);

  return <button onClick={handleClick}>Undo</button>;
};

const Download = () => {
  const undo = useStore((state) => state.undo);

  const handleClick = React.useCallback(async () => {
    const canvas = document.querySelector("canvas");

    if (!canvas) return;

    const image = canvas
      .toDataURL("image/png", 1.0)
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.download = "shared-canvas.png";
    link.href = image;
    link.click();
    link.remove();
  }, [undo]);

  return <button onClick={handleClick}>Download</button>;
};
