import { AppSlice } from "../app";
import { UserSlice } from "../user";
import { LineSlice } from "../line";

export type AppState = AppSlice & UserSlice & LineSlice;
