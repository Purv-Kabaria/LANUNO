const { parentPort } = require("worker_threads");

/**
 * This worker acts as a background auditor for the "distributed" room system.
 * It simulates a monitoring thread that manages room health and stale connections.
 */

const ROOM_TIMEOUT = 1000 * 60 * 60; // 1 hour
const STALE_MEMBER_TIMEOUT = 30000; // 30 seconds for heartbeat (if implemented)

function auditRooms(roomsMap) {
    const now = Date.now();
    let cleanedCount = 0;

    // In a real distributed system, this might be a separate microservice
    // Here we audit the shared state (communicated via messages)
    for (const [roomId, room] of roomsMap.entries()) {
        // 1. Cleanup old rooms with no members
        if (room.membersCount === 0 && (now - room.createdAt > ROOM_TIMEOUT)) {
            parentPort.postMessage({ type: "DELETE_ROOM", roomId });
            cleanedCount++;
        }
    }

    if (cleanedCount > 0) {
        console.log(`[Worker] Distributed Auditor cleaned up ${cleanedCount} stale rooms.`);
    }
}

parentPort.on("message", (msg) => {
    if (msg.type === "AUDIT") {
        // We receive a snapshot or just a trigger to perform maintenance
        auditRooms(msg.rooms);
    }
});

console.log("[Worker] Distributed Auditing Thread started.");
