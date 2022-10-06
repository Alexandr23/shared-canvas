import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";

import { connectDB } from "./db.js";
import { User } from "./models/User.js";
import { Line } from "./models/Line.js";

connectDB();

const PORT = process.env.PORT || 3000;

const MESSAGE_TYPE = {
  READY: "ready",
  INIT: "init",
  Init: "Init",
  LINE_CREATE: "line-create",
  LINE_CREATED: "line-created",
  LINE_REMOVED: "line-removed",
  UNDO: "undo",
  CLEAR: "clear",
  CLEAR_ALL: "clear-all",
  USERS: "users",
  COLOR_SELECTION: "color-selection",
  PUSH_SUBSCRIPTION: "push-subscription",
  NOTIFY: "notify",
};

const REQUEST_TYPE = {
  Init: "Init",
  CreateLine: "CreateLine",
  Undo: "Undo",
  Clear: "Clear",
  ClearAll: "ClearAll",
  SelectColor: "SelectColor",
};

const EVENT_TYPE = {
  Users: "Users",
  User: "User",
  LineCreated: "LineCreated",
  LineRemoved: "LineRemoved",
  Cleared: "Cleared",
  ClearedAll: "ClearedAll",
};

const staticBaseUrl = "../web/dist";

const httpServer = http.createServer((req, res) => {
  const isJsFile = req.url.includes(".js");
  const isCssFile = req.url.includes(".css");

  const filePath =
    isJsFile || isCssFile
      ? `${staticBaseUrl}${req.url}`
      : `${staticBaseUrl}/index.html`;
  const contentType = isJsFile
    ? "text/javascript"
    : isCssFile
    ? "text/css"
    : "text/html";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      console.log(error);
      res.writeHead(500);
      res.end();
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

const wsServer = new WebSocketServer({ server: httpServer });

wsServer.broadcast = (message, exception) => {
  wsServer.clients.forEach((client) => {
    if (client !== exception && client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
};

const getOnlineUsers = () => {
  return [...wsServer.clients]
    .map((client) => client.user)
    .filter((user) => user);
};

wsServer.on("connection", async (connection) => {
  console.log("ws: connected");

  connection.on("close", async () => {
    console.log("ws: disconnected");

    wsServer.broadcast(
      { type: MESSAGE_TYPE.USERS, users: getOnlineUsers() },
      connection
    );
  });

  connection.on("message", async (data) => {
    const message = JSON.parse(data);

    if (message.type === REQUEST_TYPE.Init) {
      let user;

      if (message.data.user) {
        user = await User.findById(message.data.user.id);
      }

      if (!user) {
        user = await User.generate();
        console.log("new user", user, user.id);
      }

      connection.user = user;

      const users = getOnlineUsers();
      const lines = await Line.find({});

      const response = JSON.stringify({
        id: message.id,
        type: message.type,
        data: { user, users, lines },
      });
      connection.send(response);

      const event = { type: EVENT_TYPE.Users, data: { users } };
      wsServer.broadcast(event, connection);
    } else {
      if (message.type === REQUEST_TYPE.CreateLine) {
        const line = await Line.create(message.data.line);

        const response = JSON.stringify({
          id: message.id,
          type: message.type,
          data: { line },
        });
        connection.send(response);

        const event = { type: EVENT_TYPE.LineCreated, data: { line } };
        wsServer.broadcast(event, connection);
      } else if (message.type === REQUEST_TYPE.Clear) {
        await Line.deleteMany({ userId: connection.user.id });

        const response = JSON.stringify({
          id: message.id,
          type: message.type,
        });
        connection.send(response);

        const event = {
          type: EVENT_TYPE.Cleared,
          data: { userId: connection.user.id },
        };
        wsServer.broadcast(event, connection);
      } else if (message.type === REQUEST_TYPE.ClearAll) {
        await Line.deleteMany({});

        const response = JSON.stringify({
          id: message.id,
          type: message.type,
        });
        connection.send(response);

        const event = { type: EVENT_TYPE.ClearedAll };
        wsServer.broadcast(event, connection);
      } else if (message.type === REQUEST_TYPE.SelectColor) {
        const user = await User.findByIdAndUpdate(
          connection.user.id,
          {
            color: message.data.color,
          },
          { new: true }
        );

        const response = JSON.stringify({
          id: message.id,
          type: message.type,
          data: { user },
        });
        connection.send(response);

        const event = { type: EVENT_TYPE.User, data: { user } };
        wsServer.broadcast(event, connection);
      } else if (message.type === REQUEST_TYPE.Undo) {
        const line = await Line.findOneAndDelete(
          { userId: connection.user.id },
          { sort: { createdAt: -1 } }
        );

        const response = JSON.stringify({
          id: message.id,
          type: message.type,
          data: { line },
        });
        connection.send(response);

        const event = { type: EVENT_TYPE.LineRemoved, data: { line } };
        wsServer.broadcast(event, connection);
      }
    }
  });
});

httpServer.listen(PORT);
