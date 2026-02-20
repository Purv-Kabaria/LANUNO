import { randomBytes } from "node:crypto";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I to avoid confusion
const LENGTH = 6;

export function generateRoomId(): string {
  const bytes = randomBytes(LENGTH);
  let id = "";
  for (let i = 0; i < LENGTH; i++) {
    id += CHARS[bytes[i]! % CHARS.length];
  }
  return id;
}
