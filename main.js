import { WebSocketServer } from "ws";
import http from "http";
import fs from "fs";

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

const wsServer = new WebSocketServer({ port: 9000 });

wsServer.on("connection", (connection) => {
  console.log("ws: connected");

  connection.on("close", () => {
    console.log("ws: disconnected");
  });

  connection.on("message", (message) => {
    const data = JSON.parse(message);

    console.log("ws: message", data);

    wsServer.clients.forEach((client) => {
      if (client !== connection && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  });
});

httpServer.listen(3000);
