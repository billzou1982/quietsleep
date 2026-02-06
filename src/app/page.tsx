"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Lang = "zh" | "en";

type NoiseType =
  | "none"
  | "white"
  | "pink"
  | "brown"
  | "rain"
  | "ocean"
  | "stream"
  | "forest";

type ThemeMode = "system" | "day" | "night";

type ThemeIcon = {
  label: string;
  icon: string;
};

type RhythmPreset = {
  id: string;
  zh: string;
  en: string;
  inhale: number;
  hold: number;
  exhale: number;
};

type Copy = {
  title: string;
  subtitle: string;
  start: string;
  stop: string;
  theme: string;
  themeSystem: string;
  themeDay: string;
  themeNight: string;
  breathe: string;
  breatheTip: string;
  rhythm: string;
  custom: string;
  inhale: string;
  hold: string;
  exhale: string;
  inhaleWord: string;
  holdWord: string;
  exhaleWord: string;
  seconds: string;
  noise: string;
  noiseTip: string;
  noiseNone: string;
  white: string;
  pink: string;
  brown: string;
  rain: string;
  ocean: string;
  stream: string;
  forest: string;
  volume: string;
  timer: string;
  timerTip: string;
  minutes: string;
  statusRunning: string;
  statusIdle: string;
  statusNotSet: string;
  noTimer: string;
  footer: string;
};

const copy: Record<Lang, Copy> = {
  zh: {
    title: "轻眠 · QuietSleep",
    subtitle: "极简、柔和的助眠工具。呼吸引导 + 噪音/自然声 + 定时关闭。",
    start: "开始",
    stop: "结束",
    theme: "外观",
    themeSystem: "跟随系统",
    themeDay: "白天",
    themeNight: "夜间",
    breathe: "睡眠引导",
    breatheTip: "选择节奏与时长，圆圈大小随呼吸时间变化。",
    rhythm: "呼吸节奏",
    custom: "自定义",
    inhale: "吸气",
    hold: "屏息",
    exhale: "呼气",
    inhaleWord: "吸气",
    holdWord: "屏息",
    exhaleWord: "呼气",
    seconds: "秒",
    noise: "助眠噪音",
    noiseTip: "人声引导可与自然环境音同时播放。",
    noiseNone: "无噪音",
    white: "白噪音",
    pink: "粉红噪音",
    brown: "棕色噪音",
    rain: "雨声",
    ocean: "海浪",
    stream: "山间溪流",
    forest: "森林虫声",
    volume: "音量",
    timer: "定时关闭",
    timerTip: "默认不启用，选择时长后生效。",
    minutes: "分钟",
    statusRunning: "计时中",
    statusIdle: "未启动",
    statusNotSet: "未设置",
    noTimer: "不启用",
    footer: "无账户，本地存储偏好设置。",
  },
  en: {
    title: "QuietSleep",
    subtitle: "A minimal, gentle sleep aid: breathing, noise, and ambience.",
    start: "Start",
    stop: "Stop",
    theme: "Theme",
    themeSystem: "System",
    themeDay: "Day",
    themeNight: "Night",
    breathe: "Sleep Guide",
    breatheTip: "Pick a rhythm and duration. Circle size reflects your breath time.",
    rhythm: "Breathing rhythm",
    custom: "Custom",
    inhale: "Inhale",
    hold: "Hold",
    exhale: "Exhale",
    inhaleWord: "Inhale",
    holdWord: "Hold",
    exhaleWord: "Exhale",
    seconds: "sec",
    noise: "Sleep Noise",
    noiseTip: "Voice cues can play together with ambience.",
    noiseNone: "None",
    white: "White Noise",
    pink: "Pink Noise",
    brown: "Brown Noise",
    rain: "Rain",
    ocean: "Ocean Waves",
    stream: "Mountain Stream",
    forest: "Forest Insects",
    volume: "Volume",
    timer: "Sleep Timer",
    timerTip: "Off by default. Choose a duration to enable.",
    minutes: "minutes",
    statusRunning: "Running",
    statusIdle: "Idle",
    statusNotSet: "Not set",
    noTimer: "No timer",
    footer: "No account. Preferences stored locally.",
  },
};

const presets: RhythmPreset[] = [
  { id: "box", zh: "Box 4-4-4", en: "Box 4-4-4", inhale: 4, hold: 4, exhale: 4 },
  { id: "478", zh: "经典 4-7-8", en: "Classic 4-7-8", inhale: 4, hold: 7, exhale: 8 },
  { id: "relax", zh: "舒缓 4-4-6", en: "Relax 4-4-6", inhale: 4, hold: 4, exhale: 6 },
];

const minuteOptions = [10, 15, 20, 30, 45, 60, 90];

const themeIcons: Record<ThemeMode, ThemeIcon> = {
  system: { label: "System", icon: "💻" },
  day: { label: "Day", icon: "☀️" },
  night: { label: "Night", icon: "🌙" },
};

const ambientTracks: Record<Exclude<NoiseType, "none">, string> = {
  white: "/audio/white-noise.wav",
  pink: "/audio/pink-noise.wav",
  brown: "/audio/brown-noise.wav",
  rain: "/audio/rain.mp3",
  ocean: "/audio/ocean-waves.mp3",
  stream: "/audio/stream.mp3",
  forest: "/audio/forest-night-insects.mp3",
};

const noiseOptions: NoiseType[] = [
  "none",
  "white",
  "pink",
  "brown",
  "rain",
  "ocean",
  "stream",
  "forest",
];


export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [rhythmId, setRhythmId] = useState<string>("relax");
  const [customRhythm, setCustomRhythm] = useState({
    inhale: 4,
    hold: 4,
    exhale: 6,
  });
  const [noiseType, setNoiseType] = useState<NoiseType>("none");
  const [volume, setVolume] = useState(0.2);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const cueTimeoutsRef = useRef<number[]>([]);
  const cycleTimeoutRef = useRef<number | null>(null);
  const sessionRunningRef = useRef(false);
  const voiceRef = useRef<{ inhale: HTMLAudioElement; hold: HTMLAudioElement; exhale: HTMLAudioElement } | null>(null);

  const t = useMemo(() => copy[lang], [lang]);

  const noiseLabels: Record<NoiseType, string> = {
    none: t.noiseNone,
    white: t.white,
    pink: t.pink,
    brown: t.brown,
    rain: t.rain,
    ocean: t.ocean,
    stream: t.stream,
    forest: t.forest,
  };

  const rhythm = useMemo(() => {
    if (rhythmId === "custom") return customRhythm;
    return presets.find((item) => item.id === rhythmId) ?? presets[2];
  }, [customRhythm, rhythmId]);

  const cycleSeconds = rhythm.inhale + rhythm.hold + rhythm.exhale;
  const inhalePercent = (rhythm.inhale / cycleSeconds) * 100;
  const holdPercent = ((rhythm.inhale + rhythm.hold) / cycleSeconds) * 100;
  const circleSize = Math.min(240, 160 + rhythm.inhale * 10);
  const circleScale = Math.min(1.2, 0.85 + rhythm.inhale * 0.04);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("quietsleep_prefs");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.lang) setLang(parsed.lang);
      if (parsed.themeMode) setThemeMode(parsed.themeMode);
      if (parsed.rhythmId) setRhythmId(parsed.rhythmId);
      if (parsed.customRhythm) setCustomRhythm(parsed.customRhythm);
      if (parsed.noiseType && noiseOptions.includes(parsed.noiseType)) {
        setNoiseType(parsed.noiseType);
      }
      if (parsed.volume !== undefined) setVolume(parsed.volume);
      if (parsed.timerMinutes !== undefined) setTimerMinutes(parsed.timerMinutes);
    } catch {
      // ignore
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "quietsleep_prefs",
      JSON.stringify({
        lang,
        themeMode,
        rhythmId,
        customRhythm,
        noiseType,
        volume,
        timerMinutes,
      })
    );
  }, [lang, themeMode, rhythmId, customRhythm, noiseType, volume, timerMinutes]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = themeMode;
    const meta = document.querySelector('meta[name="theme-color"]');
    const setThemeColor = (isDark: boolean) => {
      const color = isDark ? "#0b1120" : "#fafaf9";
      meta?.setAttribute("content", color);
      root.style.backgroundColor = color;
      document.body.style.backgroundColor = color;
    };
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyColor = () => {
      if (themeMode === "night") {
        setThemeColor(true);
        return;
      }
      if (themeMode === "day") {
        setThemeColor(false);
        return;
      }
      setThemeColor(media.matches);
    };
    applyColor();
    if (themeMode !== "system") return;
    const handler = () => applyColor();
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, [themeMode]);

  useEffect(() => {
    sessionRunningRef.current = sessionRunning;
  }, [sessionRunning]);

  useEffect(() => {
    voiceRef.current = null;
  }, [lang]);

  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = volume;
    }
  }, [volume]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };


  const ensureVoice = () => {
    if (typeof window === "undefined") return;
    if (voiceRef.current) return;
    const prefix = lang === "zh" ? "zh" : "en";
    voiceRef.current = {
      inhale: new Audio(`/audio/${prefix}-inhale.mp3`),
      hold: new Audio(`/audio/${prefix}-hold.mp3`),
      exhale: new Audio(`/audio/${prefix}-exhale.mp3`),
    };
    Object.values(voiceRef.current).forEach((audio) => {
      audio.volume = 0.9;
      audio.preload = "auto";
    });
  };

  const startNoise = useCallback(() => {
    if (noiseType === "none") return;
    const audio = ambientAudioRef.current;
    if (!audio) return;
    audio.src = ambientTracks[noiseType];
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume;
    audio.currentTime = 0;
    void audio.play();
  }, [noiseType, volume]);

  const stopNoise = useCallback(() => {
    const audio = ambientAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  useEffect(() => {
    if (!sessionRunning) return;
    if (noiseType === "none") {
      stopNoise();
      return;
    }
    startNoise();
  }, [noiseType, sessionRunning, startNoise, stopNoise]);

  const playVoice = (type: "inhale" | "hold" | "exhale") => {
    if (!voiceRef.current) return;
    const audio = voiceRef.current[type];
    audio.pause();
    audio.currentTime = 0;
    void audio.play();
  };

  const clearCues = useCallback(() => {
    cueTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    cueTimeoutsRef.current = [];
    if (cycleTimeoutRef.current) {
      window.clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
  }, []);

  const scheduleBreathCycle = useCallback(() => {
    clearCues();
    const inhaleMs = rhythm.inhale * 1000;
    const holdMs = rhythm.hold * 1000;
    const exhaleMs = rhythm.exhale * 1000;

    playVoice("inhale");
    cueTimeoutsRef.current.push(
      window.setTimeout(() => playVoice("hold"), inhaleMs)
    );
    cueTimeoutsRef.current.push(
      window.setTimeout(() => playVoice("exhale"), inhaleMs + holdMs)
    );

    cycleTimeoutRef.current = window.setTimeout(() => {
      if (sessionRunningRef.current) scheduleBreathCycle();
    }, inhaleMs + holdMs + exhaleMs);
  }, [clearCues, rhythm]);

  useEffect(() => {
    if (!sessionRunningRef.current) return;
    scheduleBreathCycle();
  }, [rhythm, scheduleBreathCycle]);

  useEffect(() => {
    if (!sessionRunningRef.current) return;
    if (!timerMinutes) {
      setTimerRunning(false);
      setRemaining(0);
      return;
    }
    setRemaining(timerMinutes * 60);
    setTimerRunning(true);
  }, [timerMinutes]);

  const stopSession = useCallback(() => {
    setSessionRunning(false);
    sessionRunningRef.current = false;
    setTimerRunning(false);
    setRemaining(0);
    clearCues();
    stopNoise();
  }, [clearCues, stopNoise]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stopSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [stopSession, timerRunning]);

  const startSession = () => {
    if (sessionRunning) return;
    ensureVoice();
    startNoise();
    if (timerMinutes) {
      setRemaining(timerMinutes * 60);
      setTimerRunning(true);
    } else {
      setRemaining(0);
      setTimerRunning(false);
    }
    setSessionRunning(true);
    sessionRunningRef.current = true;
    scheduleBreathCycle();
  };

  const toggleSession = () => {
    if (sessionRunning) {
      stopSession();
    } else {
      startSession();
    }
  };

  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === "system") return "day";
      if (prev === "day") return "night";
      return "system";
    });
  };

  const toggleLang = () => {
    setLang((prev) => (prev === "zh" ? "en" : "zh"));
  };

  return (
    <div
      className="min-h-screen text-[color:var(--qs-text)]"
      style={{
        backgroundImage:
          "linear-gradient(180deg, var(--qs-page-start) 0%, var(--qs-page-mid) 45%, var(--qs-page-end) 100%)",
      }}
    >
      <style>{`
        @keyframes breathDynamic {
          0% { transform: scale(0.85); opacity: 0.75; }
          ${inhalePercent}% { transform: scale(${circleScale}); opacity: 1; }
          ${holdPercent}% { transform: scale(${circleScale}); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0.75; }
        }
      `}</style>
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-16">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--qs-text-muted)] md:text-base">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSession}
              className="rounded-full bg-[color:var(--qs-button-bg)] px-6 py-2 text-sm text-[color:var(--qs-button-text)] transition hover:bg-[color:var(--qs-button-hover)]"
            >
              {sessionRunning ? t.stop : t.start}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cycleTheme}
                title={`${t.theme}: ${
                  themeMode === "system"
                    ? t.themeSystem
                    : themeMode === "day"
                      ? t.themeDay
                      : t.themeNight
                }`}
                className="flex h-9 w-12 items-center justify-center rounded-full border border-[color:var(--qs-border)] bg-[color:var(--qs-pill-bg)] text-base shadow-sm transition hover:text-[color:var(--qs-text)]"
              >
                <span aria-hidden="true">{themeIcons[themeMode].icon}</span>
              </button>
              <button
                type="button"
                onClick={toggleLang}
                title={lang === "zh" ? "中文" : "English"}
                className="flex h-9 items-center justify-center rounded-full border border-[color:var(--qs-border)] bg-[color:var(--qs-pill-bg)] px-4 text-xs font-semibold text-[color:var(--qs-text)] shadow-sm transition hover:text-[color:var(--qs-text)]"
              >
                {lang === "zh" ? "中文" : "EN"}
              </button>
            </div>
          </div>
        </header>

        <main className="mt-10 grid gap-6 md:grid-cols-3">
          <section className="rounded-3xl bg-[color:var(--qs-card)] p-6 shadow-sm md:col-span-2">
            <div>
              <h2 className="text-xl font-semibold">{t.breathe}</h2>
              <p className="mt-2 text-sm text-[color:var(--qs-text-muted)]">{t.breatheTip}</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setRhythmId(preset.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    rhythmId === preset.id
                      ? "border-[color:var(--qs-accent-border)] bg-[color:var(--qs-accent-soft)] text-[color:var(--qs-accent-strong)]"
                      : "border-[color:var(--qs-border)] text-[color:var(--qs-text-muted)] hover:border-[color:var(--qs-accent-border)]"
                  }`}
                >
                  <div className="font-medium">
                    {lang === "zh" ? preset.zh : preset.en}
                  </div>
                  <div className="text-xs text-[color:var(--qs-text-soft)]">
                    {t.inhale} {preset.inhale}{t.seconds} · {t.hold} {preset.hold}{t.seconds} · {t.exhale} {preset.exhale}{t.seconds}
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRhythmId("custom")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  rhythmId === "custom"
                    ? "border-[color:var(--qs-accent-border)] bg-[color:var(--qs-accent-soft)] text-[color:var(--qs-accent-strong)]"
                    : "border-[color:var(--qs-border)] text-[color:var(--qs-text-muted)] hover:border-[color:var(--qs-accent-border)]"
                }`}
              >
                <div className="font-medium">{t.custom}</div>
                <div className="text-xs text-[color:var(--qs-text-soft)]">
                  {t.inhale} {customRhythm.inhale}{t.seconds} · {t.hold} {customRhythm.hold}{t.seconds} · {t.exhale} {customRhythm.exhale}{t.seconds}
                </div>
              </button>
            </div>

            {rhythmId === "custom" && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-dashed border-[color:var(--qs-accent-border)] bg-[color:var(--qs-accent-soft)] p-4 text-sm">
                {(["inhale", "hold", "exhale"] as const).map((key) => (
                  <label key={key} className="flex items-center justify-between gap-4">
                    <span className="capitalize text-[color:var(--qs-text-secondary)]">
                      {key === "inhale" ? t.inhale : key === "hold" ? t.hold : t.exhale}
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={2}
                        max={10}
                        step={1}
                        value={customRhythm[key]}
                        onChange={(e) =>
                          setCustomRhythm((prev: typeof customRhythm) => ({
                            ...prev,
                            [key]: Number(e.target.value),
                          }))
                        }
                      />
                      <span className="w-10 text-right text-[color:var(--qs-text-muted)]">
                        {customRhythm[key]}{t.seconds}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center">
              <div
                className="relative flex items-center justify-center rounded-full bg-[color:var(--qs-accent-soft-2)] shadow-inner"
                style={{
                  width: `${circleSize}px`,
                  height: `${circleSize}px`,
                  animation: sessionRunning
                    ? `breathDynamic ${cycleSeconds}s ease-in-out infinite`
                    : "none",
                }}
              >
                <div className="h-1/2 w-1/2 rounded-full bg-[color:var(--qs-card-soft)]" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-[color:var(--qs-card)] p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{t.timer}</h2>
            <p className="mt-2 text-sm text-[color:var(--qs-text-muted)]">{t.timerTip}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimerMinutes(m)}
                  className={`rounded-2xl border px-3 py-2 text-sm transition ${
                    timerMinutes === m
                      ? "border-[color:var(--qs-accent-border)] bg-[color:var(--qs-accent-soft)] text-[color:var(--qs-accent-strong)]"
                      : "border-[color:var(--qs-border)] text-[color:var(--qs-text-muted)] hover:border-[color:var(--qs-accent-border)]"
                  }`}
                >
                  {m} {t.minutes}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTimerMinutes(null)}
                className={`rounded-2xl border px-3 py-2 text-sm transition ${
                  timerMinutes === null
                    ? "border-[color:var(--qs-accent-border)] bg-[color:var(--qs-accent-soft)] text-[color:var(--qs-accent-strong)]"
                    : "border-[color:var(--qs-border)] text-[color:var(--qs-text-muted)] hover:border-[color:var(--qs-accent-border)]"
                }`}
              >
                {t.noTimer}
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-[color:var(--qs-panel-bg)] p-4 text-center">
              <div className="text-2xl font-semibold">
                {timerRunning ? formatTime(remaining) : "--:--"}
              </div>
              <div className="mt-1 text-xs text-[color:var(--qs-accent-strong)]">
                {timerRunning
                  ? t.statusRunning
                  : timerMinutes
                    ? t.statusIdle
                    : t.statusNotSet}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-[color:var(--qs-card)] p-6 shadow-sm md:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{t.noise}</h2>
                <p className="mt-2 text-sm text-[color:var(--qs-text-muted)]">{t.noiseTip}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[color:var(--qs-text-muted)]">
                <span>{t.volume}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                />
              </div>
            </div>

            <audio ref={ambientAudioRef} loop preload="auto" className="hidden" />

            <div className="mt-5 flex flex-wrap gap-3">
              {noiseOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoiseType(type as NoiseType)}
                  className={`rounded-full px-5 py-2 text-sm transition ${
                    noiseType === type
                      ? "bg-[color:var(--qs-accent)] text-[color:var(--qs-button-text)]"
                      : "border border-[color:var(--qs-border)] text-[color:var(--qs-text-secondary)] hover:border-[color:var(--qs-accent-border)]"
                  }`}
                >
                  {noiseLabels[type]}
                </button>
              ))}
            </div>
          </section>

        </main>

        <footer className="mt-10 text-center text-xs text-[color:var(--qs-text-soft)]">
          {t.footer}
        </footer>
      </div>
    </div>
  );
}
