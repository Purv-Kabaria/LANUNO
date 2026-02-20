export type RoomRole = "host" | "player";

export interface RoomMember {
  id: string;
  name: string;
  role: RoomRole;
  joinedAt: number;
}

export interface Room {
  id: string;
  createdAt: number;
  hostConnectionId: string | null;
  members: Map<string, RoomMember>; // connectionId -> member
}

const rooms = new Map<string, Room>();

export function createRoom(roomId: string): Room {
  const room: Room = {
    id: roomId,
    createdAt: Date.now(),
    hostConnectionId: null,
    members: new Map(),
  };
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

export function setRoomHost(roomId: string, connectionId: string, name: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  room.hostConnectionId = connectionId;
  room.members.set(connectionId, {
    id: connectionId,
    name: name || "Host",
    role: "host",
    joinedAt: Date.now(),
  });
  return room;
}

export function addRoomMember(
  roomId: string,
  connectionId: string,
  name: string,
  role: RoomRole = "player"
): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  room.members.set(connectionId, {
    id: connectionId,
    name: name || "Player",
    role,
    joinedAt: Date.now(),
  });
  return room;
}

export function removeRoomMember(roomId: string, connectionId: string): Room | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  room.members.delete(connectionId);
  if (room.hostConnectionId === connectionId) room.hostConnectionId = null;
  return room;
}

export function getRoomMembers(roomId: string): RoomMember[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.members.values());
}
