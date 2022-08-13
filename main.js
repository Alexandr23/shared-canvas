import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

import { db, getUsers } from "./server/db.js";

const PORT = process.env.PORT || 3000;

const MESSAGE_TYPE = {
  INIT: "init",
  DRAW: "draw",
  CLEAR: "clear",
  CLEAR_ALL: "clear-all",
  USERS: "users",
  COLOR_SELECTION: "color-selection",
};

// In memory DB
const DB = {
  users: {},
  lines: {},
};

const getRandomHexColor = () => {
  return "#" + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, "0");
};

const generateUser = () => ({
  id: uuidv4(),
  color: getRandomHexColor(),
});

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

wsServer.on("connection", async (connection) => {
  console.log("ws: connected");

  const user = generateUser();

  DB.users[user.id] = user;
  DB.lines[user.id] = [];

  connection.on("close", () => {
    console.log("ws: disconnected");

    delete DB.users[user.id];

    wsServer.broadcast(
      { type: MESSAGE_TYPE.USERS, users: DB.users },
      connection
    );
  });

  connection.on("message", (data) => {
    const message = JSON.parse(data);

    if (message.type === MESSAGE_TYPE.DRAW) {
      DB.lines[user.id] = DB.lines[user.id] ?? [];
      DB.lines[user.id].push(message.line);
    } else if (message.type === MESSAGE_TYPE.CLEAR) {
      DB.lines[user.id] = [];
    } else if (message.type === MESSAGE_TYPE.CLEAR_ALL) {
      DB.lines = {};
    } else if (message.type === MESSAGE_TYPE.COLOR_SELECTION) {
      if (DB.users[message.userId]) {
        DB.users[message.userId].color = message.color;
      }
    }

    // console.log("ws: message", message);

    wsServer.broadcast(message, connection);
  });

  const usersFromMongo = await getUsers(db);

  connection.send(
    JSON.stringify({
      type: MESSAGE_TYPE.INIT,
      user,
      data: DB,
      usersFromMongo: usersFromMongo,
    })
  );

  wsServer.broadcast({ type: MESSAGE_TYPE.USERS, users: DB.users }, connection);
});

httpServer.listen(PORT);
