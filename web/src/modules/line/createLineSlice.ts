import { StateCreator } from "zustand";

import { api, ApiRequestType } from "../api";
import { AppState } from "../store";

import { LineSlice, Line, LineDraft } from "./types";

export const createLineSlice: StateCreator<AppState, [], [], LineSlice> = (
  set,
  get
) => ({
  lines: [],
  addLine: (line: Line) => {
    set((state) => {
      return { lines: [...state.lines, line] };
    });
  },
  initLines: (lines: Line[]) => {
    set(() => {
      return { lines };
    });
  },
  removeLine: (id: string) => {
    set((state) => {
      return { lines: state.lines.filter((line) => line.id !== id) };
    });
  },
  removeLinesByUserId: (userId: string) => {
    set((state) => {
      return { lines: state.lines.filter((line) => line.userId !== userId) };
    });
  },
  removeAllLines: () => {
    set(() => {
      return { lines: [] };
    });
  },
  createLine: async (line: LineDraft) => {
    try {
      const state = get();
      const user = state.user;

      if (!user) {
        console.log("createLine: no user found");
        return;
      }

      const response = await api.request(ApiRequestType.CreateLine, {
        line: { ...line, userId: user.id },
      });

      state.addLine(response.data.line);

      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  clear: async () => {
    try {
      const state = get();
      const user = state.user;

      if (!user) {
        console.log("clear: no user found");
        return;
      }

      const response = await api.request(ApiRequestType.Clear);

      state.removeLinesByUserId(user.id);

      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  clearAll: async () => {
    try {
      const state = get();
      const user = state.user;

      if (!user) {
        console.log("clearAll: no user found");
        return;
      }

      const response = await api.request(ApiRequestType.ClearAll);

      state.removeAllLines();

      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  undo: async () => {
    try {
      const state = get();
      const user = state.user;

      if (!user) {
        console.log("undo: no user found");
        return;
      }

      const response = await api.request(ApiRequestType.Undo);
      const line = response.data.line as Line | null;

      if (line) {
        state.removeLine(response.data.line.id);
      }

      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
});
