# Project Structure

```
LanConsole/
├── core/
│   ├── game/
│   │   ├── types.ts          # Core game types (Card, Player, GameState, etc.)
│   │   ├── deck.ts           # Deck creation and shuffling
│   │   ├── rules.ts          # Game rules and validation
│   │   └── engine.ts         # Main UNO game engine (TypeScript)
│   └── net/
│       ├── protocol.ts       # Network message types
│       ├── codec.ts          # Message encoding/decoding
│       └── connection.ts     # WebSocket/WebRTC connection wrappers
├── lib/
│   ├── game-server.ts        # Game server (TypeScript - for reference)
│   ├── game-server.js        # Game server (JavaScript - used by server.js)
│   ├── uno-engine.js         # UNO engine (JavaScript - used by server.js)
│   └── card-registry.ts      # Card registry for client-side card mapping
├── pages/
│   ├── _app.tsx              # Next.js app wrapper
│   ├── index.tsx             # Home page (links to host/controller)
│   ├── host.tsx              # Host screen (table view)
│   └── controller.tsx        # Controller UI (phone hand view)
├── styles/
│   ├── globals.css           # Global styles
│   ├── host.module.css       # Host screen styles
│   ├── controller.module.css # Controller styles
│   └── index.module.css      # Home page styles
├── public/
│   └── assets/
│       └── cards/            # Card image assets
├── server.js                 # Custom Next.js server with WebSocket
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Key Components

### Game Engine (`core/game/`)
- **types.ts**: All TypeScript interfaces and enums
- **deck.ts**: Creates standard 108-card UNO deck, shuffling logic
- **rules.ts**: Card validation, effect application, scoring
- **engine.ts**: Main game state machine and turn management

### Networking (`core/net/`)
- **protocol.ts**: Message type definitions (JOIN_LOBBY, PLAY_CARD, etc.)
- **codec.ts**: JSON message serialization
- **connection.ts**: WebSocket wrapper classes

### Server (`lib/`)
- **game-server.js**: WebSocket server that manages connections and game state
- **uno-engine.js**: JavaScript version of game engine (for Node.js server)

### UI (`pages/`)
- **host.tsx**: Displays discard pile, current color, player list, turn indicator
- **controller.tsx**: Shows player's hand, play/draw buttons, color picker

## Data Flow

1. **Client connects** → WebSocket to `/api/ws`
2. **Client sends** → `JOIN_LOBBY` with player name
3. **Server responds** → `LOBBY_STATE` with all players
4. **All ready** → Server auto-starts round
5. **Server broadcasts** → `GAME_STATE_SNAPSHOT` to all clients
6. **Client plays card** → `PLAY_CARD` message
7. **Server validates** → Updates state, broadcasts delta
8. **Repeat** until round ends

## Card Assets

Card images should be placed in `/public/assets/cards/` with naming:
- `{color}_number_{value}.png` (e.g., `red_number_5.png`)
- `{color}_{type}.png` (e.g., `yellow_skip.png`, `blue_reverse.png`)
- `Wild.png` and `Wild_Draw_Four.png`
- `back.png` (fallback image)
