import { StateCreator } from "zustand";

import { AppState } from "../store";
import { api, ApiRequestType } from "../api";
import { AppSlice } from "./types";
import { User } from "../user";

const SHARED_CANVAS_USER = "SHARED_CANVAS_USER";

export const createAppSlice: StateCreator<AppState, [], [], AppSlice> = (
  set
) => ({
  init: async () => {
    try {
      const userFromLS = window.localStorage.getItem(SHARED_CANVAS_USER);
      const user = userFromLS ? (JSON.parse(userFromLS) as User) : undefined;

      const response = await api.request(ApiRequestType.Init, { user });

      window.localStorage.setItem(
        SHARED_CANVAS_USER,
        JSON.stringify(response.data.user)
      );

      set(() => {
        return {
          lines: response.data.lines,
          users: response.data.users,
          user: response.data.user,
        };
      });
    } catch (error) {
      console.log(error);
    }
  },
});
