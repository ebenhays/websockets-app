import { WebSocket, WebSocketServer } from "ws";
import { wsArcJet } from "../config/arcjet.js";

function sendJson(socket, data) {
  if (socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket is not open");
    return;
  }
  socket.send(JSON.stringify(data));
}

function broadcast(wss, data) {
  const message = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024, // 1MB max payload
  });

  server.on("upgrade", async (req, socket, head) => {
    if (wsArcJet) {
      try {
        const decision = await wsArcJet.protect(req);
        if (decision.isDenied()) {
          if (decision.reason.isRateLimit()) {
            socket.write("HTTP/1.1 429 Too Many Requests\r\n\r\n");
          } else {
            socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
          }
          socket.destroy();
          return;
        }
      } catch (error) {
        console.error("ArcJet error during WebSocket upgrade:", error);
        socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
        socket.destroy();
        return;
      }
    }
  });
  wss.on("connection", (ws, req) => {
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    sendJson(ws, {
      type: "welcome",
      message: "You are connected to the WebSocket server!",
    });

    ws.on("message", (message) => {
      console.log("Received message:", message);
      // Handle incoming messages if needed
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  function broadcastMatchCreated(match) {
    broadcast(wss, {
      type: "matchCreated",
      match,
    });
  }
  // Heartbeat to detect and close dead connections

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping(() => {});
    });
  }, 30000);
  wss.on("close", () => {
    clearInterval(interval);
  });

  return { broadcastMatchCreated };
}
