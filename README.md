# Chess & Draft Arena

A responsive browser game combining standard chess and Zambian-style draft/checkers.

## Included
- Chess with legal move validation via `chess.js`
- Zambian-style draft rules: compulsory captures, flying kings and multi-captures
- Six selectable AI levels
- AI, local two-player and Socket.IO online-room foundations
- Adjustable clocks, player names and avatars
- Automatic terminal-result detection and victory/draw overlay
- Match history stored in local browser storage
- Responsive, tabletop-inspired 3D board styling for chess and draft

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

To run the online room server, open a second terminal in this folder:

```bash
npm run server
```

The server must be publicly reachable for players in different locations to use online rooms. Local play and online deployment are separate steps.

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

The physical tabletop look is made with CSS gradients, perspective and layered shadows. It is a 3D-style web presentation rather than a full 3D WebGL scene.
