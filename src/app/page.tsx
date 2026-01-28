"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Lang = "zh" | "en";

type NoiseType = "white" | "pink";

type Copy = {
  title: string;
  subtitle: string;
  breathe: string;
  breatheTip: string;
  breatheStart: string;
  breatheStop: string;
  noise: string;
  noiseTip: string;
  white: string;
  pink: string;
  stop: string;
  volume: string;
  timer: string;
  timerTip: string;
  startTimer: string;
  stopTimer: string;
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
    breathe: "睡眠引导",
    breatheTip: "跟随呼吸圆环：吸气 4s · 屏息 4s · 呼气 6s",
    breatheStart: "开始呼吸",
    breatheStop: "停止呼吸",
    noise: "助眠噪音",
    noiseTip: "选择白噪音或粉红噪音，配合定时关闭。",
    white: "白噪音",
    pink: "粉红噪音",
    stop: "停止",
    volume: "音量",
    timer: "定时关闭",
    timerTip: "时间到自动停止播放。",
    startTimer: "开始计时",
    stopTimer: "停止计时",
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
    subtitle: "A minimal, gentle sleep aid: breathing, white/pink noise, and timer.",
    breathe: "Sleep Guide",
    breatheTip: "Follow the ring: inhale 4s · hold 4s · exhale 6s",
    breatheStart: "Start breathing",
    breatheStop: "Stop breathing",
    noise: "Sleep Noise",
    noiseTip: "Choose white or pink noise and set a timer.",
    white: "White Noise",
    pink: "Pink Noise",
    stop: "Stop",
    volume: "Volume",
    timer: "Sleep Timer",
    timerTip: "Stops playback when time ends.",
    startTimer: "Start timer",
    stopTimer: "Stop timer",
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

const minuteOptions = [10, 15, 20, 30, 45, 60, 90];

export default function Home() {
  const [lang, setLang] = useState<Lang>("zh");
  const [breathing, setBreathing] = useState(false);
  const [noiseType, setNoiseType] = useState<NoiseType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [timerMinutes, setTimerMinutes] = useState(30);
  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const t = useMemo(() => copy[lang], [lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("quietsleep_prefs");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed.lang) setLang(parsed.lang);
      if (parsed.volume !== undefined) setVolume(parsed.volume);
      if (parsed.timerMinutes) setTimerMinutes(parsed.timerMinutes);
      if (parsed.noiseType) setNoiseType(parsed.noiseType);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "quietsleep_prefs",
      JSON.stringify({ lang, volume, timerMinutes, noiseType })
    );
  }, [lang, volume, timerMinutes, noiseType]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          stopNoise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
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

  const startNoise = (type: NoiseType) => {
    stopNoise();
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const source = ctx.createBufferSource();
    source.buffer = type === "white" ? createWhiteNoise(ctx) : createPinkNoise(ctx);
    source.loop = true;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    audioCtxRef.current = ctx;
    sourceRef.current = source;
    gainRef.current = gain;
    setNoiseType(type);
    setIsPlaying(true);
  };

  const stopNoise = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // ignore
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleTimerStart = () => {
    setRemaining(timerMinutes * 60);
    setTimerRunning(true);
  };

  const handleTimerStop = () => {
    setTimerRunning(false);
    setRemaining(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-amber-50 to-emerald-50 text-zinc-900">
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
        </header>

        <main className="mt-10 grid gap-6 md:grid-cols-3">
          <section className="rounded-3xl bg-white/90 p-6 shadow-sm md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{t.breathe}</h2>
                <p className="mt-2 text-sm text-zinc-600">{t.breatheTip}</p>
              </div>
              <button
                type="button"
                onClick={() => setBreathing((prev) => !prev)}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white transition hover:bg-zinc-800"
              >
                {breathing ? t.breatheStop : t.breatheStart}
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <div
                className={`relative flex h-52 w-52 items-center justify-center rounded-full bg-emerald-100/80 shadow-inner ${
                  breathing ? "animate-[breath_12s_ease-in-out_infinite]" : ""
                }`}
              >
                <div className="h-32 w-32 rounded-full bg-white/80" />
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

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleTimerStart}
                className="flex-1 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
              >
                {t.startTimer}
              </button>
              <button
                type="button"
                onClick={handleTimerStop}
                className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:border-zinc-300"
              >
                {t.stopTimer}
              </button>
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
              <button
                type="button"
                onClick={() => startNoise("white")}
                className={`rounded-full px-5 py-2 text-sm transition ${
                  isPlaying && noiseType === "white"
                    ? "bg-emerald-500 text-white"
                    : "border border-zinc-200 text-zinc-700 hover:border-emerald-300"
                }`}
              >
                {t.white}
              </button>
              <button
                type="button"
                onClick={() => startNoise("pink")}
                className={`rounded-full px-5 py-2 text-sm transition ${
                  isPlaying && noiseType === "pink"
                    ? "bg-emerald-500 text-white"
                    : "border border-zinc-200 text-zinc-700 hover:border-emerald-300"
                }`}
              >
                {t.pink}
              </button>
              <button
                type="button"
                onClick={stopNoise}
                className="rounded-full border border-zinc-200 px-5 py-2 text-sm text-zinc-700 hover:border-zinc-300"
              >
                {t.stop}
              </button>
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
