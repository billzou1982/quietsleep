# QuietSleep

QuietSleep is a gentle sleep and relaxation app focused on fast, low-friction nighttime use.

- **Web**: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Mobile**: Expo (React Native)

## Current Product Features

### 1) Breathing Exercise
- Preset breathing rhythms:
  - Box 4-4-4
  - Classic 4-7-8
  - Relax 4-4-6
  - Custom
- Custom rhythm sliders (inhale / hold / exhale)
- Central breathing circle as unified start/stop control
- Voice-guided cues for inhale/hold/exhale

### 2) Sleep Timer
- Timer presets:
  - 10 min, 20 min, 30 min, 60 min, 4 hr, 8 hr
- Uses default/last-selected duration
- Countdown display
- Auto-stop when timer reaches zero

### 3) Sleep Sounds
- Sound options:
  - White Noise
  - Pink Noise
  - Brown Noise
  - Forest Rain
  - Gentle Waves
  - Mountain Stream
  - Forest Insects
  - Campfire
  - Singing Bowl
- Unified selected-state style across cards

### 4) Meditation
- Language-aware track display:
  - English UI shows English meditation tracks
  - Chinese UI shows Chinese meditation tracks
- 2 English + 2 Chinese meditation tracks
- Track selection does **not** auto-play
- Playback starts/stops only via central circle button
- Meditation playback loops until stopped or timer ends
- Selecting a meditation track auto-enables timer using default/last-selected duration

### 5) Mode Interaction Rules
- Meditation is mutually exclusive with:
  - Breathing Exercise
  - Sleep Sounds
- Switching to breathing or sounds will stop meditation

### 6) UX & Theme
- Bilingual UI: 中文 / EN
- Improved high-clarity light theme (better daytime contrast)
- Dark/night theme support
- Preferences saved locally

## Project Structure

```text
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
