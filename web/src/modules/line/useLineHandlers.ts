import React from "react";

import { api, ApiEventType, ApiEvent } from "../api";
import { AppState, useStore } from "../store";
import { User } from "../user";
import { Line } from "./types";

const useEventHandler = (
  type: ApiEventType,
  selectAction: (state: AppState) => Function,
  selectData: (message: ApiEvent) => any
) => {
  const action = useStore(selectAction);

  const handler = React.useCallback(
    (message: ApiEvent) => {
      const data = selectData(message);
      action(data);
      console.log("handle event", data);
    },
    [action, selectData]
  );

  React.useEffect(() => {
    api.on(type, handler);

    return () => {
      api.off(type, handler);
    };
  }, [type, handler]);
};

const selectAddLine = (state: AppState) => state.addLine;
const selectLineCreatedData = (message: ApiEvent) => message.data?.line as Line;

const selectRemoveLinesByUserId = (state: AppState) =>
  state.removeLinesByUserId;
const selectClearedData = (message: ApiEvent) => message.data?.userId as string;

const selectRemoveAllLines = (state: AppState) => state.removeAllLines;
const selectClearedAllData = () => undefined;

const selectRemoveLine = (state: AppState) => state.removeLine;
const selectLineRemovedData = (message: ApiEvent) =>
  message.data?.line.id as string;

const selectSetUser = (state: AppState) => state.setUser;
const selectUserData = (message: ApiEvent) => message.data?.user as User;

export const useLineHandlers = () => {
  useEventHandler(
    ApiEventType.LineCreated,
    selectAddLine,
    selectLineCreatedData
  );

  useEventHandler(
    ApiEventType.Cleared,
    selectRemoveLinesByUserId,
    selectClearedData
  );

  useEventHandler(
    ApiEventType.ClearedAll,
    selectRemoveAllLines,
    selectClearedAllData
  );

  useEventHandler(
    ApiEventType.LineRemoved,
    selectRemoveLine,
    selectLineRemovedData
  );

  // TODO: Move to user/
  useEventHandler(ApiEventType.User, selectSetUser, selectUserData);
};
