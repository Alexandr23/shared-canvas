import React from "react";

import { useStore } from "../store";

import styles from "./ColorSelection.module.css";

type ColorSelectionProps = {};

export const ColorSelection: React.FC<ColorSelectionProps> = () => {
  const selectColor = useStore((state) => state.selectColor);

  const [isOpen, setIsOpen] = React.useState(false);

  const handleClick = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleSelect = React.useCallback(
    async (event: React.MouseEvent) => {
      const color = event.currentTarget.getAttribute("data-color") as string;

      await selectColor(color);

      setIsOpen(false);
    },
    [selectColor]
  );

  return (
    <>
      <button onClick={handleClick}>Color</button>

      {isOpen && (
        <div className={styles.root}>
          <div className={styles.box}>
            <div className={styles.wrapper}>
              {COLORS.map((color) => {
                return (
                  <div
                    key={color}
                    className={styles.item}
                    style={{ backgroundColor: color }}
                    data-color={color}
                    onClick={handleSelect}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const COLORS = [
  "#C0392B",
  "#FF1B41",
  "#E74C3C",
  "#9B59B6",
  "#8E44AD",
  "#2980B9",
  "#3498DB",
  "#1ABC9C",
  "#16A085",
  "#27AE60",
  "#2ECC71",
  "#F1C40F",
  "#F39C12",
  "#E67E22",
  "#D35400",
  "#34495E",
];
