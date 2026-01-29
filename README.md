# QuietSleep

A minimal, gentle sleep‑aid app with breathing guidance, noise, and timers.

- **Web**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Mobile**: Expo (React Native)

## Features
- Sleep guide (breathing/relaxation) with voice cues
- White & pink noise generator
- Sleep timer (auto stop)
- Bilingual UI (中文 / EN)
- Local preferences storage

## Project Structure
```
.
├─ src/app/              # Web app (Next.js)
├─ public/audio/         # Shared audio assets
└─ apps/mobile/          # Expo mobile app
```

## Getting Started (Web)
```bash
npm install
npm run dev
```
Open <http://localhost:3000>.

## Getting Started (Mobile)
```bash
cd apps/mobile
npm install
npm run start
```
Then open the Expo Go app and scan the QR code.
