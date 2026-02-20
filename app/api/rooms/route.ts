import { NextResponse } from "next/server";
import { generateRoomId } from "@/lib/room-id";
// Use JS store so custom server (server.js) shares the same in-memory store
import { createRoom, getRoom } from "@/lib/rooms-store.js";
export const dynamic = "force-dynamic";

export async function POST() {
  let roomId = generateRoomId();
  let attempts = 0;
  while (getRoom(roomId) && attempts < 10) {
    roomId = generateRoomId();
    attempts++;
  }
  if (getRoom(roomId)) {
    return NextResponse.json({ error: "Could not generate unique room ID" }, { status: 500 });
  }
  createRoom(roomId);
  return NextResponse.json({ roomId });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ error: "roomId required" }, { status: 400 });
  }
  const room = getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({
    roomId: room.id,
    memberCount: room.members.size,
  });
}
