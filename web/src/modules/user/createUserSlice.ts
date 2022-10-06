import { StateCreator } from "zustand";

import { api, ApiRequestType } from "../api";
import { AppState } from "../store";

import { UserSlice, User } from "./types";

export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (
  set,
  get
) => ({
  user: undefined,
  users: [],
  initUsers: (users: User[]) => {
    set(() => {
      return { users };
    });
  },
  setUser: (user: User) => {
    const state = get();

    const hasUser = Boolean(state.users.find((u) => u.id === user.id));
    const users = hasUser
      ? state.users.map((u) => {
          return u.id === user.id ? user : u;
        })
      : state.users;
    const currentUser = state.user?.id === user.id ? user : state.user;

    set(() => {
      return { users, user: currentUser };
    });
  },
  setColor: (color: string) => {
    const user = get().user;

    if (!user) {
      console.log("setColor: no user found");
      return;
    }

    set(() => {
      return { user: { ...user, color } };
    });
  },
  selectColor: async (color: string) => {
    try {
      const response = await api.request(ApiRequestType.SelectColor, { color });

      get().setColor(color);

      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  },
});
