export function createRoom(roomId: string): unknown;
export function getRoom(roomId: string): unknown;
export function deleteRoom(roomId: string): void;
export function setRoomHost(roomId: string, connectionId: string, name: string): unknown;
export function addRoomMember(roomId: string, connectionId: string, name: string, role?: string): unknown;
export function removeRoomMember(roomId: string, connectionId: string): unknown;
export function getRoomMembers(roomId: string): { id: string; name: string; role: string }[];
