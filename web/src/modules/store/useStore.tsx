import create from "zustand";

import { createAppSlice } from "../app/createAppSlice";
import { createUserSlice } from "../user/createUserSlice";
import { createLineSlice } from "../line/createLineSlice";

import { AppState } from "./types";

export const useStore = create<AppState>((...args) => ({
  ...createAppSlice(...args),
  ...createLineSlice(...args),
  ...createUserSlice(...args),
}));
