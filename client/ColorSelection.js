import { COLOR_SELECTION_EVENT } from "./Events.js";

const COLORS = [
  "#C0392B",
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
  "#E67E22",
  "#D35400",
  "#34495E",
];

export class ColorSelection {
  constructor(eventEmitter) {
    this.eventEmitter = eventEmitter;
    this.colors = COLORS;
  }

  open = () => {
    this.root = document.createElement("div");
    this.root.className = "color-selection";

    const box = document.createElement("div");
    box.className = "color-selection__box";

    const wrapper = document.createElement("div");
    wrapper.className = "color-selection__wrapper";

    this.root.append(box);
    box.append(wrapper);

    this.colors.forEach((color) => {
      const item = document.createElement("div");
      item.className = "color-selection__item";
      item.setAttribute("data-color", color);
      item.style.backgroundColor = color;
      item.addEventListener("click", this.handleColorClick);

      wrapper.append(item);
    });

    document.body.append(this.root);
  };

  handleColorClick = (event) => {
    const color = event.currentTarget.getAttribute("data-color");

    if (color) {
      this.eventEmitter.emit(COLOR_SELECTION_EVENT, { color });
    }

    this.close();
  };

  close = () => {
    this.root.remove();
  };
}
