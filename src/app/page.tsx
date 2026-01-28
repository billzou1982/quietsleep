"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Lang = "zh" | "en";

type NoiseType = "none" | "white" | "pink";

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
  breathe: string;
  breatheTip: string;
  rhythm: string;
  custom: string;
  inhale: string;
  hold: string;
  exhale: string;
  seconds: string;
  noise: string;
  noiseTip: string;
  noiseNone: string;
  white: string;
  pink: string;
  volume: string;
  timer: string;
  timerTip: string;
  minutes: string;
  statusRunning: string;
  statusIdle: string;
  guide: string;
  guideItems: string[];
  footer: string;
};

const copy: Record<Lang, Copy> = {
  zh: {
    title: "轻眠 · QuietSleep",
    subtitle: "极简、柔和的助眠工具。呼吸引导 + 白/粉红噪音 + 定时关闭。",
    start: "一键开始",
    stop: "一键停止",
    breathe: "睡眠引导",
    breatheTip: "选择节奏与时长，圆圈大小随呼吸时间变化。",
    rhythm: "呼吸节奏",
    custom: "自定义",
    inhale: "吸气",
    hold: "屏息",
    exhale: "呼气",
    seconds: "秒",
    noise: "助眠噪音",
    noiseTip: "可与呼吸音效同时播放。",
    noiseNone: "无噪音",
    white: "白噪音",
    pink: "粉红噪音",
    volume: "音量",
    timer: "定时关闭",
    timerTip: "时间到自动停止播放。",
    minutes: "分钟",
    statusRunning: "计时中",
    statusIdle: "未启动",
    guide: "放松建议",
    guideItems: [
      "调暗屏幕与环境灯光",
      "睡前 30 分钟避免高刺激内容",
      "保持房间略微偏凉、通风",
    ],
    footer: "无账户，本地存储偏好设置。",
  },
  en: {
    title: "QuietSleep",
    subtitle: "A minimal, gentle sleep aid: breathing, noise, and timer.",
    start: "Start",
    stop: "Stop",
    breathe: "Sleep Guide",
    breatheTip: "Pick a rhythm and duration. Circle size reflects your breath time.",
    rhythm: "Breathing rhythm",
    custom: "Custom",
    inhale: "Inhale",
    hold: "Hold",
    exhale: "Exhale",
    seconds: "sec",
    noise: "Sleep Noise",
    noiseTip: "Breathing tones can play together with noise.",
    noiseNone: "None",
    white: "White Noise",
    pink: "Pink Noise",
    volume: "Volume",
    timer: "Sleep Timer",
    timerTip: "Stops playback when time ends.",
    minutes: "minutes",
    statusRunning: "Running",
    statusIdle: "Idle",
    guide: "Wind-down tips",
    guideItems: [
      "Dim screens and ambient light",
      "Avoid stimulating content 30 mins before bed",
      "Keep the room slightly cool and ventilated",
    ],
    footer: "No account. Preferences stored locally.",
  },
};

const presets: RhythmPreset[] = [
  { id: "box", zh: "Box 4-4-4", en: "Box 4-4-4", inhale: 4, hold: 4, exhale: 4 },
  { id: "478", zh: "经典 4-7-8", en: "Classic 4-7-8", inhale: 4, hold: 7, exhale: 8 },
  { id: "relax", zh: "舒缓 4-4-6", en: "Relax 4-4-6", inhale: 4, hold: 4, exhale: 6 },
];

const minuteOptions = [10, 15, 20, 30, 45, 60, 90];

const loadPrefs = () => {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem("quietsleep_prefs");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export default function Home() {
  const initial = loadPrefs();
  const [lang, setLang] = useState<Lang>(() => initial?.lang ?? "zh");
  const [rhythmId, setRhythmId] = useState<string>(() => initial?.rhythmId ?? "relax");
  const [customRhythm, setCustomRhythm] = useState(() => initial?.customRhythm ?? {
    inhale: 4,
    hold: 4,
    exhale: 6,
  });
  const [noiseType, setNoiseType] = useState<NoiseType>(() => initial?.noiseType ?? "pink");
  const [volume, setVolume] = useState(() => initial?.volume ?? 0.4);
  const [timerMinutes, setTimerMinutes] = useState(() => initial?.timerMinutes ?? 30);
  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const cueGainRef = useRef<GainNode | null>(null);
  const cueTimeoutsRef = useRef<number[]>([]);
  const cycleTimeoutRef = useRef<number | null>(null);
  const sessionRunningRef = useRef(false);

  const t = useMemo(() => copy[lang], [lang]);

  const rhythm = useMemo(() => {
    if (rhythmId === "custom") return customRhythm;
    return presets.find((item) => item.id === rhythmId) ?? presets[2];
  }, [customRhythm, rhythmId]);

  const cycleSeconds = rhythm.inhale + rhythm.hold + rhythm.exhale;
  const inhalePercent = (rhythm.inhale / cycleSeconds) * 100;
  const holdPercent = ((rhythm.inhale + rhythm.hold) / cycleSeconds) * 100;
  const circleSize = Math.min(240, 160 + rhythm.inhale * 10);
  const circleScale = Math.min(1.2, 0.85 + rhythm.inhale * 0.04);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "quietsleep_prefs",
      JSON.stringify({
        lang,
        rhythmId,
        customRhythm,
        noiseType,
        volume,
        timerMinutes,
      })
    );
  }, [lang, rhythmId, customRhythm, noiseType, volume, timerMinutes]);

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

  useEffect(() => {
    sessionRunningRef.current = sessionRunning;
  }, [sessionRunning]);

  useEffect(() => {
    if (noiseGainRef.current) {
      noiseGainRef.current.gain.value = volume;
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

  const ensureAudioContext = async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    if (!cueGainRef.current && audioCtxRef.current) {
      cueGainRef.current = audioCtxRef.current.createGain();
      cueGainRef.current.gain.value = 0.2;
      cueGainRef.current.connect(audioCtxRef.current.destination);
    }
  };

  const createWhiteNoise = (ctx: AudioContext) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const createPinkNoise = (ctx: AudioContext) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = pink * 0.11;
    }
    return buffer;
  };

  const startNoise = () => {
    if (!audioCtxRef.current || noiseType === "none") return;
    const ctx = audioCtxRef.current;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const source = ctx.createBufferSource();
    source.buffer = noiseType === "white" ? createWhiteNoise(ctx) : createPinkNoise(ctx);
    source.loop = true;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    noiseSourceRef.current = source;
    noiseGainRef.current = gain;
  };

  const stopNoise = useCallback(() => {
    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch {
        // ignore
      }
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }
    if (noiseGainRef.current) {
      noiseGainRef.current.disconnect();
      noiseGainRef.current = null;
    }
  }, []);

  const playCue = (type: "inhale" | "hold" | "exhale") => {
    if (!audioCtxRef.current || !cueGainRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = type === "inhale" ? 396 : type === "hold" ? 528 : 333;
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.value = 0.18;
    osc.connect(gain);
    gain.connect(cueGainRef.current);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.4);
  };

  const clearCues = useCallback(() => {
    cueTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    cueTimeoutsRef.current = [];
    if (cycleTimeoutRef.current) {
      window.clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
  }, []);

  const scheduleBreathCycle = () => {
    clearCues();
    const inhaleMs = rhythm.inhale * 1000;
    const holdMs = rhythm.hold * 1000;
    const exhaleMs = rhythm.exhale * 1000;

    playCue("inhale");
    cueTimeoutsRef.current.push(
      window.setTimeout(() => playCue("hold"), inhaleMs)
    );
    cueTimeoutsRef.current.push(
      window.setTimeout(() => playCue("exhale"), inhaleMs + holdMs)
    );

    cycleTimeoutRef.current = window.setTimeout(() => {
      if (sessionRunningRef.current) scheduleBreathCycle();
    }, inhaleMs + holdMs + exhaleMs);
  };

  const startSession = async () => {
    if (sessionRunning) return;
    await ensureAudioContext();
    startNoise();
    setRemaining(timerMinutes * 60);
    setTimerRunning(true);
    setSessionRunning(true);
    sessionRunningRef.current = true;
    scheduleBreathCycle();
  };

  const stopSession = useCallback(() => {
    setSessionRunning(false);
    sessionRunningRef.current = false;
    setTimerRunning(false);
    setRemaining(0);
    clearCues();
    stopNoise();
  }, [clearCues, stopNoise]);

  const toggleSession = () => {
    if (sessionRunning) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-amber-50 to-emerald-50 text-zinc-900">
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
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 md:text-base">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSession}
              className="rounded-full bg-zinc-900 px-6 py-2 text-sm text-white transition hover:bg-zinc-800"
            >
              {sessionRunning ? t.stop : t.start}
            </button>
            <div className="flex items-center gap-2 rounded-full bg-white/80 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setLang("zh")}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  lang === "zh"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  lang === "en"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        <main className="mt-10 grid gap-6 md:grid-cols-3">
          <section className="rounded-3xl bg-white/90 p-6 shadow-sm md:col-span-2">
            <div>
              <h2 className="text-xl font-semibold">{t.breathe}</h2>
              <p className="mt-2 text-sm text-zinc-600">{t.breatheTip}</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setRhythmId(preset.id)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    rhythmId === preset.id
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                      : "border-zinc-200 text-zinc-600 hover:border-emerald-200"
                  }`}
                >
                  <div className="font-medium">
                    {lang === "zh" ? preset.zh : preset.en}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {t.inhale} {preset.inhale}{t.seconds} · {t.hold} {preset.hold}{t.seconds} · {t.exhale} {preset.exhale}{t.seconds}
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRhythmId("custom")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  rhythmId === "custom"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                    : "border-zinc-200 text-zinc-600 hover:border-emerald-200"
                }`}
              >
                <div className="font-medium">{t.custom}</div>
                <div className="text-xs text-zinc-500">
                  {t.inhale} {customRhythm.inhale}{t.seconds} · {t.hold} {customRhythm.hold}{t.seconds} · {t.exhale} {customRhythm.exhale}{t.seconds}
                </div>
              </button>
            </div>

            {rhythmId === "custom" && (
              <div className="mt-4 grid gap-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-sm">
                {(["inhale", "hold", "exhale"] as const).map((key) => (
                  <label key={key} className="flex items-center justify-between gap-4">
                    <span className="capitalize text-zinc-700">
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
                      <span className="w-10 text-right text-zinc-600">
                        {customRhythm[key]}{t.seconds}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center">
              <div
                className="relative flex items-center justify-center rounded-full bg-emerald-100/80 shadow-inner"
                style={{
                  width: `${circleSize}px`,
                  height: `${circleSize}px`,
                  animation: sessionRunning
                    ? `breathDynamic ${cycleSeconds}s ease-in-out infinite`
                    : "none",
                }}
              >
                <div className="h-1/2 w-1/2 rounded-full bg-white/80" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{t.timer}</h2>
            <p className="mt-2 text-sm text-zinc-600">{t.timerTip}</p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimerMinutes(m)}
                  className={`rounded-2xl border px-3 py-2 text-sm transition ${
                    timerMinutes === m
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                      : "border-zinc-200 text-zinc-600 hover:border-emerald-200"
                  }`}
                >
                  {m} {t.minutes}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-center">
              <div className="text-2xl font-semibold">
                {timerRunning ? formatTime(remaining) : "00:00"}
              </div>
              <div className="mt-1 text-xs text-emerald-700">
                {timerRunning ? t.statusRunning : t.statusIdle}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-6 shadow-sm md:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{t.noise}</h2>
                <p className="mt-2 text-sm text-zinc-600">{t.noiseTip}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600">
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

            <div className="mt-5 flex flex-wrap gap-3">
              {["none", "white", "pink"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoiseType(type as NoiseType)}
                  className={`rounded-full px-5 py-2 text-sm transition ${
                    noiseType === type
                      ? "bg-emerald-500 text-white"
                      : "border border-zinc-200 text-zinc-700 hover:border-emerald-300"
                  }`}
                >
                  {type === "none" ? t.noiseNone : type === "white" ? t.white : t.pink}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-6 shadow-sm md:col-span-3">
            <h2 className="text-xl font-semibold">{t.guide}</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {t.guideItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="mt-10 text-center text-xs text-zinc-500">
          {t.footer}
        </footer>
      </div>
    </div>
  );
}
