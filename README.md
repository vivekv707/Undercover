# Undercover

Undercover is a backend-free, pass-and-play social deduction PWA for 3-20 players. It includes eight local word packs, secret handoffs, clue rounds, timed discussion, private voting, tie handling, Mr. White guesses, and automatic win detection.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run lint
npm run build
```

The production build generates an installable manifest and service worker. All game state, setup preferences, and used-word history stay in browser storage on the device.
