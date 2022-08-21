import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";
import webPush from "web-push";

import { connectDB } from "./server/db.js";
import { User } from "./server/models/User.js";
import { Line } from "./server/models/Line.js";
import { PushSubscription } from "./server/models/PushSubscription.js";

connectDB();

const PORT = process.env.PORT || 3000;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

const MESSAGE_TYPE = {
  READY: "ready",
  INIT: "init",
  INIT: "init",
  DRAW: "draw",
  CLEAR: "clear",
  CLEAR_ALL: "clear-all",
  USERS: "users",
  COLOR_SELECTION: "color-selection",
  PUSH_SUBSCRIPTION: "push-subscription",
  NOTIFY: "notify",
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

webPush.setVapidDetails(
  "mailto:nikiforovalex.tusur@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const notify = async (data) => {
  const pushSubsriptions = (await PushSubscription.find({})).map((r) =>
    r.toObject()
  );
  const onlineUsersIds = getOnlineUsers().map((user) => user.id);
  const pushSubsriptionsOffline = pushSubsriptions.filter(
    ({ userId }) => !onlineUsersIds.includes(userId)
  );

  console.log("Notify", pushSubsriptionsOffline);

  pushSubsriptionsOffline.forEach((ps) => {
    const { _id, __v, id, userId, ...pushSubsription } = ps;

    webPush.sendNotification(pushSubsription, data).catch((err) => {
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log(
          "Subscription has expired or is no longer valid: ",
          err,
          _id
        );
        return PushSubscription.deleteOne({ _id });
      } else {
        throw err;
      }
    });
  });
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
      let pushSubscription;

      if (message.user) {
        user = await User.findById(message.user.id);
      }

      if (user) {
        pushSubscription = await PushSubscription.findOne({ userId: user.id });
      } else {
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
          VAPID_PUBLIC_KEY,
          hasPushSubscription: Boolean(pushSubscription),
        })
      );

      wsServer.broadcast({ type: MESSAGE_TYPE.USERS, users }, connection);
    } else {
      wsServer.broadcast(message, connection);

      if (message.type === MESSAGE_TYPE.PUSH_SUBSCRIPTION) {
        await PushSubscription.create(message.pushSubscription);
      } else if (message.type === MESSAGE_TYPE.NOTIFY) {
        notify(message.data);
      } else if (message.type === MESSAGE_TYPE.DRAW) {
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
