/**
 * In-memory room store. Used by API routes and the WebSocket server (custom server).
 * Must be plain JS so server.js can require it.
 */

const rooms = global.__rooms_store || new Map();
if (!global.__rooms_store) {
  console.log("[Store] Initializing new global room store");
  global.__rooms_store = rooms;
} else {
  console.log("[Store] Reusing existing global room store");
}

function createRoom(roomId) {
  console.log(`[Store] Creating room: ${roomId}`);
  const room = {
    id: roomId,
    createdAt: Date.now(),
    hostConnectionId: null,
    members: new Map(),
  };
  rooms.set(roomId, room);
  return room;
}

function getRoom(roomId) {
  const room = rooms.get(roomId);
  console.log(`[Store] Getting room: ${roomId} - ${room ? "Found" : "Not Found"}`);
  return room;
}

function deleteRoom(roomId) {
  console.log(`[Store] Deleting room: ${roomId}`);
  rooms.delete(roomId);
}

function setRoomHost(roomId, connectionId, name) {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  room.hostConnectionId = connectionId;
  const member = {
    id: connectionId,
    playerId: "host",
    name: name || "Host",
    role: "host",
    joinedAt: Date.now(),
  };
  room.members.set(connectionId, member);
  return room;
}

function addRoomMember(roomId, connectionId, name, role = "player", playerId = null) {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  // If player already has a connection in this room, we might want to clean it up later
  // but for now we just add the new connection.

  room.members.set(connectionId, {
    id: connectionId,
    playerId: playerId || connectionId,
    name: name || "Player",
    role,
    joinedAt: Date.now(),
  });
  return room;
}

function removeRoomMember(roomId, connectionId) {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  const member = room.members.get(connectionId);
  if (member) {
    console.log(`[Store] Removing member ${member.name} (${connectionId}) from room ${roomId}`);
    room.members.delete(connectionId);
    if (room.hostConnectionId === connectionId) room.hostConnectionId = null;
  }
  return room;
}

function getRoomMembers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  // Use a Map to filter by unique playerId to ensure no duplicates in UI
  const uniqueMembers = new Map();
  for (const m of room.members.values()) {
    uniqueMembers.set(m.playerId, m);
  }
  return Array.from(uniqueMembers.values());
}

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  setRoomHost,
  addRoomMember,
  removeRoomMember,
  getRoomMembers,
};
