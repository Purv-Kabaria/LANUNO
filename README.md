# 🎴 LANUNO — Distributed LAN UNO

**LAN party–style UNO on a single TV, phones as controllers, works completely offline.**

The laptop (host) runs the entire game and renders the **shared table view** (discard pile, current color, turn order, card counts, log).  
Each player joins from their **phone browser**, which becomes their **private hand + controller**. All devices connect over a local hotspot; no internet is required.

---

## ✨ Highlights

- **UNO-style gameplay**: Classic rules (0–9, Skip, Reverse, Draw Two, Wild, Wild Draw Four) with optional house rules.
- **Phones as controllers**: Players see only their own cards and action buttons, not anyone else’s hand.
- **Host table screen**: One big screen for the whole room (TV/projector/laptop) showing the top card, color, turn, and game log.
- **Fully offline**: Uses local hotspot + LAN discovery. No external servers.
- **Ultra-low latency**: WebRTC DataChannels and a lean, event-driven protocol keep input → response time extremely low, even with 8 players.

---

## 🧩 Gameplay Overview

### Core loop

1. **Create lobby on host**  
   The host opens the LANConsole host UI, starts a lobby, and optionally configures house rules.

2. **Players join from phones**  
   Players connect to the host’s hotspot and open the controller URL. They enter a name and join the lobby.

3. **Deal & play**  
   - Host shuffles a standard UNO deck and deals hands.  
   - The host screen shows the starting card and whose turn it is.  
   - On your phone you tap a card to **play**, tap a button to **draw**, and tap **UNO!** when you’re down to one card.  

4. **Round and match flow**  
   - When someone goes out, the host auto-calculates scores based on remaining cards.  
   - The host can quickly start the next round with the same players and rules.

### House rules (configurable)

- **Stacking**: Allow stacking Draw Two / Wild Draw Four cards.  
- **7–0 rule**: Play a 7 to swap hands; play a 0 to rotate hands.  
- **Jump-in**: Allow playing an identical card out of turn.  
- **Starting hand size**: e.g. 7, 10, or custom.  
- **Turn timer**: Auto-draw or auto-skip if a player takes too long.

---

## 🧱 High-Level Architecture

### Roles

- **Host (laptop / main screen)**
  - Authoritative game state (deck, hands, discard pile, turn order, house rules, scores).
  - Renders the **table UI** (discard pile, current color, player order, card counts, logs).
  - Runs signaling for WebRTC, plus WebSocket fallback.
  - Handles LAN discovery (UDP / mDNS) so phones can find the host.
  - Optionally maintains periodic snapshots for backup/rejoin.

- **Controllers (phones)**
  - Render the player’s **private hand**, actions, and a mini-log.
  - Send **high-level intents only**: `JOIN`, `READY`, `PLAY_CARD`, `DRAW`, `CALL_UNO`, `CHOOSE_COLOR`, etc.
  - Never simulate the game world; they simply display state received from the host.

---

## ⚡ Low-Latency Design

Although UNO is turn-based, LANConsole is engineered to feel **instant** and to scale cleanly to 8 phones.

### Transport strategy

- **Primary**: WebRTC DataChannels (browser-to-host, peer-to-peer over LAN).
  - **Reliable, ordered channel** for all game-critical messages (plays, draws, color choices, final state).  
  - **Optional second, unreliable channel** for non-critical UX (typing indicators, emotes, pings).
- **Fallback**: WebSocket (TCP) if WebRTC is unavailable.
- **Discovery**: UDP broadcast / mDNS so phones can locate the host IP without manual entry.

### Event-driven instead of heavy ticks

- The game is governed by a **finite-state machine** on the host:
  - `LOBBY → DEALING → IN_TURN → RESOLVING_EFFECTS → ROUND_END → SCOREBOARD → NEXT_ROUND`.
- Instead of 60 Hz physics-like ticks, the host reacts to a **small number of discrete events**:
  - `PLAYER_PLAY_CARD`
  - `PLAYER_DRAW`
  - `PLAYER_CALL_UNO`
  - `TURN_TIMEOUT`
  - `HOUSE_RULE_CHANGE`
- Each event:
  1. Is validated on the host (turn ownership, legal play, sufficient cards, UNO call correctness).
  2. Mutates a **single authoritative game state object**.
  3. Emits compact **delta updates** to all players and the host UI.

This minimizes bandwidth and CPU while keeping **input → visual feedback** latency just a few milliseconds on LAN.

### Message design (small, binary, explicit)

For very low overhead, messages can be represented as small binary frames:

- **Client → Host (examples)**  
  - `JOIN_LOBBY { name }`  
  - `PLAY_CARD { cardId, chosenColor? }`  
  - `DRAW_CARD`  
  - `CALL_UNO`  
  - `PONG` (for heartbeat)

- **Host → Client (examples)**  
  - `GAME_STATE_SNAPSHOT` – full state on join/resync.  
  - `GAME_STATE_DELTA` – per-event diffs (card removed/added, turn changed, color changed, penalties applied).  
  - `LOBBY_STATE` – when players join/leave/ready up or rules change.  
  - `ERROR` – illegal move, wrong turn, invalid color, etc.  
  - `HEARTBEAT` – lightweight ping + logical time for ordering and monitoring.

Sequence numbers and timestamps allow strict ordering and detection of duplicates or stale messages.

---

## 🔁 Consistency, Fault Tolerance & Rejoins

### Authoritative host

- All card operations happen **only on the host**:
  - Shuffling
  - Dealing
  - Drawing
  - Validating plays
  - Applying penalties and points
- Phones are **thin clients**: they never infer deck contents beyond what the host sends.

### Event ordering

- Each event from a controller carries:
  - `playerId`
  - `seq` (per-client sequence number)
  - `clientTs` (client timestamp)
- The host attaches:
  - `serverTs`
  - Monotonic **logical time** (Lamport-style) to break ties when necessary.
- This ensures a consistent order for effects like stacking Draw cards, jump-ins, and simultaneous joins.

### Heartbeats and disconnects

- Controllers send a small `PONG` or presence update periodically.  
- The host:
  - Marks a player as **disconnected** after a short timeout.  
  - Can automatically **skip/disqualify** disconnected players or let them **rejoin** and bind to the same seat.

### Optional backup host

- The host may periodically emit **snapshots** (deck, discard pile, hands, scores, current state) that:
  - Can be mirrored to a backup laptop.  
  - Allow a hot handover in case the primary host crashes (implementation-dependent).

---

## 🧰 Tech Stack

- **Framework**: `Next.js 15` for host UI, controller UI, routing, and static assets.
- **Runtime**: `Node.js 20+`.
- **Network**:
  - `WebRTC DataChannels` for low-latency, P2P-like communication.
  - `ws` (WebSocket) for signaling and as a fallback transport.
  - `dgram` (Node UDP) for LAN discovery and host announcements.
- **Language**: TypeScript for strict types and protocol safety.
- **Assets**:
  - High-quality card image assets under `assets/cards/*` for host and controller UIs.

---

## 📦 Repository Layout (conceptual)

Exact structure may evolve, but the project is generally organized as:

- `host/` – host table UI (Next.js pages/components, game state visualisation).
- `controller/` – controller UI for phones (hand view, buttons, mini-log).
- `core/game/` – game rules engine:
  - Card, deck, and rule definitions.
  - Finite-state machine for rounds and turns.
  - Score calculation and house rule configuration.
- `core/net/` – network layer:
  - WebRTC/WebSocket setup.
  - Message codecs and validation.
  - Discovery and heartbeat logic.
- `assets/cards/` – card images and related visual assets.

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v20+`
- `npm` or `yarn`
- A laptop that can run a modern browser comfortably.
- Modern smartphones with WebRTC-capable browsers.

### Setup

```bash
git clone https://github.com/Purv-Kabaria/LANConsole.git
cd LANConsole
npm install
```

### Development

```bash
npm run dev
```

Then:

- Open the **host screen** on the laptop:  
  `http://localhost:3000/host`
- Open the **controller** on each phone (connected to the same network):  
  `http://<laptop-ip>:3000/controller`

### Production

```bash
npm run build
npm start
```

For a real-world LAN party, run the production build on the laptop and mirror the host browser to a TV/projector.

---

## 📶 Running on a Laptop Hotspot

1. Enable your laptop’s hotspot (e.g. SSID: `LANConsole-Host`).  
2. Connect all phones to this hotspot.  
3. Start the app (`npm run dev` or `npm start`).  
4. On the laptop, open `http://localhost:3000/host`.  
5. On each phone, open `http://<laptop-ip>:3000/controller` (replace with the IP shown in your network settings).

Because all traffic stays local to the hotspot, **latency is dominated by Wi‑Fi airtime**, which is typically only a few milliseconds.

---

## 🧪 Testing & Profiling

Useful test scenarios:

- **Connectivity**
  - Verify discovery and connection establishment for 2–8 controllers.
  - Test WebRTC and WebSocket fallback paths.

- **Latency**
  - Measure **tap → visual feedback** on host and controller.  
  - Confirm that under normal LAN conditions the delay is effectively unnoticeable (< 50–70 ms).

- **Load**
  - Fill lobbies with 8 players and test:
    - Frequent jump-ins / stacking.  
    - Rapid emotes or chat spam.  
    - Disconnect/reconnect cycles.

---

## 🤝 Contributing

Contributions are welcome! Typical flow:

1. Fork the repo.  
2. Create a feature branch.  
3. Implement and test your changes.  
4. Open a Pull Request with a clear description of the change and any protocol impacts.

Guidelines:

- Prefer **TypeScript** for all protocol and game-logic work.  
- Keep network messages **small and explicit**.  
- Avoid heavy allocations inside critical message paths.  
- Document any changes to the wire protocol in the code and commit messages.

---

## 📜 License

**LANConsole** is released under the **MIT License**.  
You are free to use, modify, distribute, and commercialize it.

# 🚀 Distributed LAN Console — README

**Project name:** **LANConsole — Distributed LAN UNO (Host Screen + Phone Controllers)**

**Short description:**  
An ultra-low-latency multiplayer **UNO-style card game** where a laptop acts as the *authoritative host + table display* and players use their phones (browser) as controllers for their private hands. Works fully offline using a laptop hotspot. The host screen shows the discard pile, current color/value, turn order, and game log; each phone shows only that player’s hand and action buttons.

**Primary goals**
- UNO-style rules (draw, skip, reverse, +2, +4, wild, stacking options)  
- Support for **2–8 players** connected over LAN  
- Ultra-low-latency using WebRTC DataChannels + WebSocket fallback  
- Strong distributed-computing layer (discovery, ordering, fault tolerance, replication)

# 🎮 Features

## Core Gameplay (UNO Variant)
- Classic UNO deck (0–9, Skip, Reverse, Draw Two, Wild, Wild Draw Four)  
- Configurable house rules (stacking, 7-0 swaps, jump-ins, starting hand size)  
- Per-player hands visible only on their phone controllers  
- Host “table” view showing top discard, current color, turn indicator, and card counts  
- Turn timer, auto-draw/auto-play options, and quick re-hosting for new rounds

## Host Display
- Single-table layout optimized for TVs/projectors  
- Clear top-card and color indicator  
- Visible player order, whose turn it is, and remaining cards per player  
- Status banner for actions (e.g., “Player 3 played Draw Two on Player 1”)  
- Optional minimal info panel for spectators (round, scores, rule set)

## Networking & DC Features
- **WebRTC DataChannels** (primary, unreliable/unordered)  
- **WebSocket** fallback + signaling  
- UDP broadcast / mDNS host discovery  
- Authoritative host with prediction + reconciliation  
- Sequenced events with Lamport-style ordering  
- Heartbeat-based fault tolerance  
- Optional soft replication to backup host

# 🏗️ System Architecture

## Roles
**Host (Laptop)**
- Runs UNO rules, turn order, shuffling, scoring, and authoritative reconciliation  
- Renders the shared table view (discard pile, color, player summaries)  
- Runs WebRTC signaling + WebSocket fallback  
- Broadcasts presence for discovery  

**Controller (Phones)**
- Sends high-level actions only (play card X, draw, call UNO, choose color)  
- Shows the player’s hand, possible actions, and a compact action log  
- Provides ready state, chat/emotes, and settings UI for host-approved house rules  

**Optional Backup Host**
- Maintains soft-synced state snapshots

## Network Flow
1. Discovery → UDP/mDNS → Host reply  
2. Signaling → WebSocket → WebRTC negotiation  
3. Realtime → DataChannels (unreliable)  
4. Rendering → Host produces final split-screen image

## Host Split-Screen Responsibilities
- Render 1–8 viewports  
- Independent frustum culling per camera  
- Per-viewport resolution scaling

# 🧰 Tech Stack

## Rendering (3D Engine)
- **Babylon.js** — recommended (multi-camera, shadows, postprocess pipelines)  
- **Alternatively:** Three.js for full customization  

## Web Framework
- **Next.js 15** for host UI + static assets  
- Controller UI using HTML/JS or tiny React/Preact

## Networking
- **WebRTC DataChannels** (unreliable, unordered, maxRetransmits=0)  
- **WebSocket (ws)** for signaling/fallback  
- **Node.js dgram** for UDP LAN discovery  
- Optional: `wrtc` for server-side RTCPeerConnection

## Performance Tools
- WebWorkers for physics or packet parsing  
- WASM for intensive physics/collision  
- pm2 for stability  
- TypeScript for protocol safety

# 🖥️ Split-Screen Rendering Design

## Viewport Layouts (adaptive)
- **1p:** Fullscreen  
- **2p:** Horizontal or vertical split  
- **3–4p:** 2×2 grid  
- **5–8p:** 4×2 or 2×4 grid  

## Camera Setup (per player)
- Chase camera (offset + smoothing)  
- Collision-aware camera  
- Drift roll + collision shake  
- HUD per viewport (speed, lap, minimap, nitro)

## Rendering Optimizations
1. Resolution scaling per viewport  
2. Lower shadow quality above 2 players  
3. Frustum culling in each viewport  
4. GPU instancing for repeated props  
5. Static mesh merging  
6. Postprocessing disabled above 4 players  
7. Dynamic quality adaptation

## Example resolution strategy (1080p)
- 1p → 1920×1080  
- 2p → 960×1080  
- 4p → 960×540  
- 8p → 480×540  

# ⚡ Networking & Low-Latency Strategy

## Transport
- WebRTC DataChannels (unreliable) — fastest in browsers  
- WebSocket fallback (TCP) — reliability when needed

## Tick Strategy
- **Server (host):** 60Hz physics  
- **Client inputs:** 30–60Hz  
- **State updates:** 10–20Hz (delta-compressed)  

## Input Packet (binary)
- uint8 playerId  
- int16 steerX  
- int16 throttle  
- uint8 actions  
- uint16 seq  
- uint32 clientTs  

## Prediction & Reconciliation
- Phone predicts movement instantly  
- Host sends corrections  
- Client smoothly reconciles to avoid snapping  

# 🏎️ Performance Guidelines

## Host Hardware (8 players)
- Quad-core or better CPU  
- GTX 1650 / 1660 or equivalent GPU  
- 8–16GB RAM  
- SSD

## Engine Practices
- Avoid GC allocations  
- Physics in worker or WASM  
- Chunk/batch network writes  
- Use OffscreenCanvas (experimental)  

# 🎯 Gameplay Mechanics

## Vehicle Physics
- Deterministic fixed-step  
- Forward accel, lateral friction, yaw torque  
- Drift handled via reduced lateral grip  

## Camera & Controls
- Chase camera with FOV boost effect  
- Tilt steering + touch throttle/brake  
- Per-player HUD elements  

## Collisions
- Simplified convex bodies  
- Host-only collision resolution  
- Camera shake + speed penalties for impacts  

# ⚙️ Installation & Setup

## Prerequisites
- Node.js v20+  
- npm/yarn  
- Laptop with mid-range GPU  
- Modern phones supporting WebRTC  

## Setup
```bash
git clone https://github.com/Purv-Kabaria/LANConsole.git
cd LANConsole
npm install
```

## Development
```bash
npm run dev
```

## Production
```bash
npm run build
npm start
```

## Running on Laptop Hotspot
1. Enable laptop hotspot (`LANConsole-Host`)  
2. Connect phones to hotspot  
3. Host UI: `http://localhost:3000/host` or `http://<laptop-ip>:3000/host`  
4. Controllers: `http://<laptop-ip>:3000/controller`  

# 🧪 Testing & Profiling

## Connectivity Tests
- Test WebRTC RTT for all 1–8 controllers  

## Rendering Tests
- Test 1/2/4/8 viewport FPS and GPU usage  

## Latency Measurements
- Input → server  
- Server tick → render  
- Render → perception latency (< 70ms ideal)  

# 🤖 Distributed Computing Concepts

## Leader Model
- Host laptop = authoritative leader  
- Phones = distributed nodes  

## Discovery
- UDP broadcast/mDNS  

## Event Ordering
- Sequence numbers  
- Dual timestamps  
- Lamport-style when resolving merges  

## Fault Tolerance
- Heartbeats every 200ms  
- Timeout → ghost mode or AI takeover  

## Replication (optional)
- Snapshot + delta to backup host  

# 🤝 Contributing

## Workflow
1. Fork  
2. Branch  
3. Commit  
4. Push  
5. PR  

## Guidelines
- TypeScript for protocol structures  
- Maintain binary packet formats  
- Heavy processing → Worker/WASM  

# 📜 License

**LANConsole**  
Released under MIT License.  
Free to use, modify, distribute, and commercialize.