# Setup Instructions

## Prerequisites

- Node.js v20 or higher
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Usage

1. **Host Screen**: Open `http://localhost:3000/host` on your laptop/TV
2. **Controller**: Open `http://<laptop-ip>:3000/controller` on each phone
3. Players join the lobby, set ready, and the game auto-starts when all are ready

## Card Assets

Make sure your card assets are in `/public/assets/cards/` directory with the following naming convention:
- `{color}_{type}_{value}.png` for numbered cards (e.g., `red_number_5.png`)
- `{color}_{type}.png` for action cards (e.g., `yellow_skip.png`)
- `Wild.png` and `Wild_Draw_Four.png` for wild cards
- `back.png` for card back (fallback)

## Production Build

```bash
npm run build
npm start
```

## Notes

- The WebSocket server runs on the same port as the Next.js app
- Make sure all devices are on the same network (LAN or hotspot)
- For best performance, use a laptop hotspot for offline play
