import { Point } from "../point";

export type LineDraft = {
  color: string;
  points: Point[];
};

export type Line = {
  id: string;
  userId: string;
  points: Point[];
  color: string;
};

export type LineSlice = {
  lines: Line[];
  initLines: (lines: Line[]) => void;
  addLine: (line: Line) => void;
  removeLine: (id: string) => void;
  removeLinesByUserId: (userId: string) => void;
  removeAllLines: () => void;
  createLine: (line: LineDraft) => Promise<any>;
  clear: () => Promise<any>;
  clearAll: () => Promise<any>;
  undo: () => Promise<any>;
};
