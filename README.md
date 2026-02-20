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
- `pnpm`, `npm`, or `yarn`
- A laptop that can run a modern browser comfortably.
- Modern smartphones with WebRTC-capable browsers.

### Setup

```bash
git clone https://github.com/Purv-Kabaria/LANConsole.git
cd LANConsole
pnpm install
```

### Development

```bash
pnpm dev
```

Then:

- Open the **host screen** on the laptop:  
  `http://localhost:3000/host`
- Open the **controller** on each phone (connected to the same network):  
  `http://<laptop-ip>:3000/controller`

### Production

```bash
pnpm build
pnpm start
```

For a real-world LAN party, run the production build on the laptop and mirror the host browser to a TV/projector.

---

## 📶 Running on a Laptop Hotspot

1. Enable your laptop’s hotspot (e.g. SSID: `LANUNO-Host`).  
2. Connect all phones to this hotspot.  
3. Start the app (`pnpm dev` or `pnpm start`).  
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

**LANUNO** is released under the **MIT License**.  
You are free to use, modify, distribute, and commercialize it.