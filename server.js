const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");
const { Worker } = require("worker_threads");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev });
const handle = app.getRequestHandler();

const roomStore = require("./lib/rooms-store.js");

// Distributed Computing: Spawn a background worker thread for room auditing and maintenance
const roomWorker = new Worker(path.join(__dirname, "lib", "room-worker.js"));

roomWorker.on("message", (msg) => {
  if (msg.type === "DELETE_ROOM") {
    console.log(`[Main] Deleting room ${msg.roomId} as requested by Auditor Thread`);
    roomStore.deleteRoom(msg.roomId);
  }
});

// Periodically send state to the auditor thread to simulate distributed cross-thread state monitoring
setInterval(() => {
  const roomsSnapshot = Array.from(global.__rooms_store || []).map(([id, r]) => ({
    id,
    createdAt: r.createdAt,
    membersCount: r.members.size
  }));
  roomWorker.postMessage({ type: "AUDIT", rooms: new Map(roomsSnapshot.map(r => [r.id, r])) });
}, 30000); // Audit every 30 seconds

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url, true);
    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  wss.on("connection", (ws, req) => {
    let connectionId = null;
    let roomId = null;
    let role = null;
    const send = (msg) => {
      if (ws.readyState === 1) ws.send(JSON.stringify(msg));
    };

    const broadcastLobbyState = (rid) => {
      const members = roomStore.getRoomMembers(rid);
      wss.clients.forEach((client) => {
        if (client.roomId === rid && client.readyState === 1) {
          client.send(JSON.stringify({ type: "LOBBY_STATE", members }));
        }
      });
    };

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "JOIN") {
          connectionId = msg.connectionId;
          roomId = msg.roomId;
          role = msg.role || "player";
          const name = msg.name || (role === "host" ? "Host" : "Player");
          const playerId = msg.playerId;

          const room = roomStore.getRoom(roomId);
          if (!room) {
            send({ type: "ERROR", error: "Room not found" });
            return;
          }
          if (role === "host") {
            roomStore.setRoomHost(roomId, connectionId, name);
          } else {
            roomStore.addRoomMember(roomId, connectionId, name, "player", playerId);
          }

          ws.connectionId = connectionId;
          ws.roomId = roomId;
          ws.role = role;

          console.log(`[Socket] ${role.toUpperCase()} joined: ${name} (${connectionId}) in room: ${roomId}`);

          send({ type: "JOINED", connectionId, roomId, members: roomStore.getRoomMembers(roomId) });
          broadcastLobbyState(roomId);
        }

        if (msg.type === "LEAVE") {
          const rid = msg.roomId || roomId;
          console.log(`[Socket] LEAVE received for room: ${rid}, connection: ${connectionId}`);
          if (rid && connectionId) {
            roomStore.removeRoomMember(rid, connectionId);
            broadcastLobbyState(rid);
          }
        }
      } catch (e) {
        send({ type: "ERROR", error: e.message || "Invalid message" });
      }
    });

    ws.on("close", () => {
      if (roomId && connectionId) {
        console.log(`[Socket] Closing connection: ${connectionId} for room: ${roomId}`);
        roomStore.removeRoomMember(roomId, connectionId);
        broadcastLobbyState(roomId);
      }
    });
  });

  server.listen(port, "0.0.0.0", (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Local Network: http://0.0.0.0:${port}`);
    console.log(`> WebSocket on ws://localhost:${port}/ws`);
  });
});
