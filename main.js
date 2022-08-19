import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";

import { connectDB } from "./server/db.js";
import { User } from "./server/models/User.js";
import { Line } from "./server/models/Line.js";

connectDB();

const PORT = process.env.PORT || 3000;

const MESSAGE_TYPE = {
  READY: "ready",
  INIT: "init",
  INIT: "init",
  DRAW: "draw",
  CLEAR: "clear",
  CLEAR_ALL: "clear-all",
  USERS: "users",
  COLOR_SELECTION: "color-selection",
};

const httpServer = http.createServer((req, res) => {
  const isJsFile = req.url.includes(".js");
  const filePath = isJsFile ? `.${req.url}` : "./index.html";
  const contentType = isJsFile ? "text/javascript" : "text/html";

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

    if (message.type === MESSAGE_TYPE.READY) {
      let user;

      if (message.user) {
        user = await User.findById(message.user.id);
      }

      if (!user) {
        user = await User.generate();
        console.log("new user", user, user.id);
      }

      connection.user = user;

      const users = getOnlineUsers();
      const lines = await Line.find({});

      connection.send(
        JSON.stringify({
          type: MESSAGE_TYPE.INIT,
          user,
          users,
          lines,
        })
      );

      wsServer.broadcast({ type: MESSAGE_TYPE.USERS, users }, connection);
    } else {
      wsServer.broadcast(message, connection);

      if (message.type === MESSAGE_TYPE.DRAW) {
        await Line.create(message.line);
      } else if (message.type === MESSAGE_TYPE.CLEAR) {
        await Line.deleteMany({ userId: message.userId });
      } else if (message.type === MESSAGE_TYPE.CLEAR_ALL) {
        await Line.deleteMany({});
      } else if (message.type === MESSAGE_TYPE.COLOR_SELECTION) {
        await User.findByIdAndUpdate(connection.user.id, {
          color: message.color,
        });
      }
    }
  });
});

httpServer.listen(PORT);
