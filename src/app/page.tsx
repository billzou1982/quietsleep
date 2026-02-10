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
  | "forest"
  | "campfire"
  | "singing-bowl";

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
  campfire: string;
  singingBowl: string;
  voice: string;
  voiceOn: string;
  voiceOff: string;
  timer: string;
  timerTip: string;
  minutes: string;
  statusRunning: string;
  statusIdle: string;
  statusNotSet: string;
  noTimer: string;
  meditation: string;
  meditationEn: string;
  meditationZh: string;
  meditationHint: string;
  footer: string;
};

const copy: Record<Lang, Copy> = {
  zh: {
    title: "轻眠",
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
    rain: "树林雨声",
    ocean: "柔和海浪",
    stream: "山间溪流",
    forest: "森林虫声",
    campfire: "篝火声",
    singingBowl: "颂钵冥想",
    voice: "节奏声",
    voiceOn: "启用",
    voiceOff: "不启用",
    timer: "定时关闭",
    timerTip: "默认不启用，选择时长后生效。",
    minutes: "分钟",
    statusRunning: "计时中",
    statusIdle: "未启动",
    statusNotSet: "未设置",
    noTimer: "不启用",
    meditation: "冥想",
    meditationEn: "冥想（EN）",
    meditationZh: "冥想（中文）",
    meditationHint: "点击标题框开始/停止音频",
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
    rain: "Forest Rain",
    ocean: "Gentle Waves",
    stream: "Mountain Stream",
    forest: "Forest Insects",
    campfire: "Campfire",
    singingBowl: "Singing Bowl",
    voice: "Voice Cues",
    voiceOn: "On",
    voiceOff: "Off",
    timer: "Sleep Timer",
    timerTip: "Off by default. Choose a duration to enable.",
    minutes: "minutes",
    statusRunning: "Running",
    statusIdle: "Idle",
    statusNotSet: "Not set",
    noTimer: "No timer",
    meditation: "Meditation",
    meditationEn: "Meditation (EN)",
    meditationZh: "Meditation (中文)",
    meditationHint: "Tap the tile to start/stop audio",
    footer: "No account. Preferences stored locally.",
  },
};

const presets: RhythmPreset[] = [
  { id: "box", zh: "Box 4-4-4", en: "Box 4-4-4", inhale: 4, hold: 4, exhale: 4 },
  { id: "478", zh: "经典 4-7-8", en: "Classic 4-7-8", inhale: 4, hold: 7, exhale: 8 },
  { id: "relax", zh: "舒缓 4-4-6", en: "Relax 4-4-6", inhale: 4, hold: 4, exhale: 6 },
];

const minuteOptions = [
  { value: 10, labelZh: "10 分钟", labelEn: "10 min" },
  { value: 20, labelZh: "20 分钟", labelEn: "20 min" },
  { value: 30, labelZh: "30 分钟", labelEn: "30 min" },
  { value: 60, labelZh: "60 分钟", labelEn: "60 min" },
  { value: 240, labelZh: "4 小时", labelEn: "4 hr" },
  { value: 480, labelZh: "8 小时", labelEn: "8 hr" },
];

const themeIcons: Record<ThemeMode, ThemeIcon> = {
  system: { label: "System", icon: "💻" },
  day: { label: "Day", icon: "☀️" },
  night: { label: "Night", icon: "🌙" },
};

const ambientTracks: Record<Exclude<NoiseType, "none">, string> = {
  white: "/audio/white-noise.wav",
  pink: "/audio/pink-noise.wav",
  brown: "/audio/brown-noise.wav",
  rain: "/audio/forest-rain-light.mp3",
  ocean: "/audio/ocean-gentle.mp3",
  stream: "/audio/stream.mp3",
  forest: "/audio/forest-night-insects.mp3",
  campfire: "/audio/campfire.mp3",
  "singing-bowl": "/audio/singing-bowl.mp3",
};

const noiseOptions: NoiseType[] = [
  "white",
  "pink",
  "brown",
  "rain",
  "ocean",
  "stream",
  "forest",
  "campfire",
  "singing-bowl",
];


export default function Home() {
  const [lang, setLang] = useState<Lang>("en");
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [rhythmId, setRhythmId] = useState<string>(presets[0].id);
  const [customRhythm, setCustomRhythm] = useState({
    inhale: 4,
    hold: 4,
    exhale: 6,
  });
  const [noiseType, setNoiseType] = useState<NoiseType>("white");
  const [guideEnabled, setGuideEnabled] = useState(false);
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [meditationEnabled, setMeditationEnabled] = useState(false);
  const [meditationPlaying, setMeditationPlaying] = useState(false);
  const [activeMeditationId, setActiveMeditationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [phaseRemaining, setPhaseRemaining] = useState<number | null>(null);
  const [phaseTotal, setPhaseTotal] = useState<number | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const lastGuideRef = useRef<string | null>(null);
  const lastNoiseRef = useRef<NoiseType | null>(null);
  const lastTimerRef = useRef<number | null>(null);
  const phaseIntervalRef = useRef<number | null>(null);
  const navTimeoutRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);

  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const meditationVoiceRef = useRef<HTMLAudioElement | null>(null);
  const meditationBedRef = useRef<HTMLAudioElement | null>(null);
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
    campfire: t.campfire,
    "singing-bowl": t.singingBowl,
  };

  const rhythm = useMemo(() => {
    if (rhythmId === "custom") return customRhythm;
    return presets.find((item) => item.id === rhythmId) ?? presets[2];
  }, [customRhythm, rhythmId]);

  const cycleSeconds = rhythm.inhale + rhythm.hold + rhythm.exhale;
  const inhalePercent = (rhythm.inhale / cycleSeconds) * 100;
  const holdPercent = ((rhythm.inhale + rhythm.hold) / cycleSeconds) * 100;
  const runningBaseSize = 180;
  const idleCircleSize = 220;
  const displayCircleSize = sessionRunning ? runningBaseSize : idleCircleSize;
  const maxDiameter = runningBaseSize + (rhythm.inhale - 1) * 15;
  const circleScale = maxDiameter / runningBaseSize;
  const phaseLabel =
    phase === "inhale"
      ? t.inhaleWord
      : phase === "hold"
        ? t.holdWord
        : phase === "exhale"
          ? t.exhaleWord
          : t.start;
  const phaseScale = useMemo(() => {
    const minScale = 1.0;
    const maxScale = circleScale;
    if (!sessionRunning || !guideEnabled || phase === "idle" || !phaseTotal || phaseRemaining === null) {
      return 1;
    }
    const progress = 1 - Math.min(1, Math.max(0, phaseRemaining / phaseTotal));
    if (phase === "inhale") {
      return minScale + (maxScale - minScale) * progress;
    }
    if (phase === "hold") {
      return maxScale;
    }
    if (phase === "exhale") {
      return maxScale - (maxScale - minScale) * progress;
    }
    return 1;
  }, [circleScale, guideEnabled, phase, phaseRemaining, phaseTotal, sessionRunning]);

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
        lastNoiseRef.current = parsed.noiseType;
      }
      if (parsed.guideEnabled !== undefined) {
        setGuideEnabled(Boolean(parsed.guideEnabled));
      }
      if (parsed.noiseEnabled !== undefined) {
        setNoiseEnabled(Boolean(parsed.noiseEnabled));
      }
      if (parsed.timerEnabled !== undefined) {
        setTimerEnabled(Boolean(parsed.timerEnabled));
      }
      if (parsed.timerMinutes !== undefined) {
        setTimerMinutes(parsed.timerMinutes);
        lastTimerRef.current = parsed.timerMinutes;
      }
      if (parsed.meditationEnabled !== undefined) {
        setMeditationEnabled(Boolean(parsed.meditationEnabled));
      }
      if (parsed.rhythmId) {
        lastGuideRef.current = parsed.rhythmId;
      }
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
        guideEnabled,
        noiseEnabled,
        timerEnabled,
        timerMinutes,
        meditationEnabled,
      })
    );
  }, [lang, themeMode, rhythmId, customRhythm, noiseType, guideEnabled, noiseEnabled, timerEnabled, timerMinutes, meditationEnabled]);

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
    if (!noiseEnabled) return;
    if (noiseType === "none") return;
    const audio = ambientAudioRef.current;
    if (!audio) return;
    audio.src = ambientTracks[noiseType];
    audio.loop = true;
    audio.preload = "auto";
    audio.currentTime = 0;
    void audio.play();
  }, [noiseType, noiseEnabled]);

  const stopNoise = useCallback(() => {
    const audio = ambientAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const stopMeditationAudio = useCallback(() => {
    meditationVoiceRef.current?.pause();
    meditationBedRef.current?.pause();
    if (meditationVoiceRef.current) meditationVoiceRef.current.currentTime = 0;
    if (meditationBedRef.current) meditationBedRef.current.currentTime = 0;
    setMeditationPlaying(false);
    setActiveMeditationId(null);
  }, []);

  const startMeditationAudio = useCallback((voiceSrc: string, meditationId: string) => {
    if (!meditationEnabled) return;
    if (!meditationVoiceRef.current || !meditationBedRef.current) return;
    meditationVoiceRef.current.src = voiceSrc;
    meditationBedRef.current.loop = true;
    meditationBedRef.current.volume = 0.35;
    meditationVoiceRef.current.volume = 0.9;
    meditationBedRef.current.currentTime = 0;
    meditationVoiceRef.current.currentTime = 0;
    void meditationBedRef.current.play();
    void meditationVoiceRef.current.play();
    setMeditationPlaying(true);
    setActiveMeditationId(meditationId);
  }, [meditationEnabled]);

  useEffect(() => {
    if (!sessionRunning) return;
    if (!noiseEnabled || noiseType === "none") {
      stopNoise();
      return;
    }
    startNoise();
  }, [noiseType, noiseEnabled, sessionRunning, startNoise, stopNoise]);

  useEffect(() => {
    if (!meditationEnabled) {
      stopMeditationAudio();
    }
  }, [meditationEnabled, stopMeditationAudio]);

  const meditationTracks = useMemo(
    () => [
      { id: "en-1", label: `${t.meditationEn} 1`, voiceSrc: "/audio/meditation-voice.mp3" },
      { id: "en-2", label: `${t.meditationEn} 2`, voiceSrc: "/audio/meditation-voice.mp3" },
      { id: "zh-1", label: `${t.meditationZh} 1`, voiceSrc: "/audio/meditation-zh-1.mp3" },
      { id: "zh-2", label: `${t.meditationZh} 2`, voiceSrc: "/audio/meditation-zh-2.mp3" },
    ],
    [t.meditationEn, t.meditationZh]
  );

  const playVoice = useCallback((type: "inhale" | "hold" | "exhale") => {
    if (!guideEnabled) return;
    if (!voiceRef.current) return;
    const audio = voiceRef.current[type];
    audio.pause();
    audio.currentTime = 0;
    void audio.play();
  }, [guideEnabled]);

  const clearCues = useCallback(() => {
    cueTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    cueTimeoutsRef.current = [];
    if (cycleTimeoutRef.current) {
      window.clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    if (phaseIntervalRef.current) {
      window.clearInterval(phaseIntervalRef.current);
      phaseIntervalRef.current = null;
    }
    setPhase("idle");
    setPhaseRemaining(null);
    setPhaseTotal(null);
  }, []);

  const startPhase = useCallback((next: "inhale" | "hold" | "exhale", seconds: number) => {
    if (phaseIntervalRef.current) {
      window.clearInterval(phaseIntervalRef.current);
    }
    setPhase(next);
    setPhaseRemaining(seconds);
    setPhaseTotal(seconds);
    phaseIntervalRef.current = window.setInterval(() => {
      setPhaseRemaining((prev) => {
        if (prev === null) return null;
        return prev > 1 ? prev - 1 : 0;
      });
    }, 1000);
  }, []);

  const scheduleBreathCycle = useCallback(() => {
    clearCues();
    const inhaleMs = rhythm.inhale * 1000;
    const holdMs = rhythm.hold * 1000;
    const exhaleMs = rhythm.exhale * 1000;

    startPhase("inhale", rhythm.inhale);
    playVoice("inhale");
    cueTimeoutsRef.current.push(
      window.setTimeout(() => {
        startPhase("hold", rhythm.hold);
        playVoice("hold");
      }, inhaleMs)
    );
    cueTimeoutsRef.current.push(
      window.setTimeout(() => {
        startPhase("exhale", rhythm.exhale);
        playVoice("exhale");
      }, inhaleMs + holdMs)
    );

    cycleTimeoutRef.current = window.setTimeout(() => {
      if (sessionRunningRef.current) scheduleBreathCycle();
    }, inhaleMs + holdMs + exhaleMs);
  }, [clearCues, rhythm, playVoice, startPhase]);

  useEffect(() => {
    voiceRef.current = null;
    if (!sessionRunningRef.current) return;
    if (!guideEnabled) return;
    ensureVoice();
    scheduleBreathCycle();
  }, [lang, scheduleBreathCycle, guideEnabled]);

  useEffect(() => {
    if (!sessionRunningRef.current) return;
    if (!guideEnabled) return;
    scheduleBreathCycle();
  }, [rhythm, scheduleBreathCycle, guideEnabled]);

  useEffect(() => {
    if (!guideEnabled) {
      clearCues();
      return;
    }
    if (!sessionRunningRef.current) return;
    ensureVoice();
    scheduleBreathCycle();
  }, [guideEnabled, clearCues, scheduleBreathCycle]);

  useEffect(() => {
    if (!timerEnabled) {
      setTimerRunning(false);
      setRemaining(0);
      return;
    }
    if (!sessionRunningRef.current) return;
    if (!timerMinutes) {
      setTimerRunning(false);
      setRemaining(0);
      return;
    }
    setRemaining(timerMinutes * 60);
    setTimerRunning(true);
  }, [timerEnabled, timerMinutes]);

  const stopSession = useCallback(() => {
    setSessionRunning(false);
    sessionRunningRef.current = false;
    setTimerRunning(false);
    setRemaining(0);
    clearCues();
    stopNoise();
  }, [clearCues, stopNoise]);

  const disableMeditation = useCallback(() => {
    setMeditationEnabled(false);
    stopMeditationAudio();
  }, [stopMeditationAudio]);

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
    if (!timerEnabled) {
      setTimerRunning(false);
      setRemaining(0);
    }
  }, [timerEnabled]);

  useEffect(() => {
    if (guideEnabled || noiseEnabled || timerEnabled) {
      disableMeditation();
    }
  }, [guideEnabled, noiseEnabled, timerEnabled, disableMeditation]);

  const startSession = () => {
    if (sessionRunning) return;
    if (meditationEnabled) {
      setMeditationEnabled(false);
      stopMeditationAudio();
    }
    if (guideEnabled) ensureVoice();
    startNoise();
    if (timerEnabled && timerMinutes) {
      setRemaining(timerMinutes * 60);
      setTimerRunning(true);
    } else {
      setRemaining(0);
      setTimerRunning(false);
    }
    setSessionRunning(true);
    sessionRunningRef.current = true;
    if (guideEnabled) {
      scheduleBreathCycle();
    }
  };

  const toggleSession = () => {
    if (sessionRunning) {
      stopSession();
    } else {
      startSession();
    }
  };

  const handleMeditationToggle = (next: boolean) => {
    if (next) {
      stopSession();
      setGuideEnabled(false);
      setNoiseEnabled(false);
      setTimerEnabled(false);
      setTimerMinutes(null);
      setMeditationEnabled(true);
      return;
    }
    setMeditationEnabled(false);
    stopMeditationAudio();
  };

  const toggleMeditationPlayback = (voiceSrc: string, meditationId: string) => {
    if (!meditationEnabled) {
      handleMeditationToggle(true);
      startMeditationAudio(voiceSrc, meditationId);
      return;
    }
    if (meditationPlaying && activeMeditationId === meditationId) {
      stopMeditationAudio();
      return;
    }
    startMeditationAudio(voiceSrc, meditationId);
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

  const triggerMobileNav = useCallback(() => {
    setShowMobileNav(true);
    if (navTimeoutRef.current) {
      window.clearTimeout(navTimeoutRef.current);
    }
    navTimeoutRef.current = window.setTimeout(() => {
      setShowMobileNav(false);
    }, 5000);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;
    triggerMobileNav();
    const handleTouchStart = (event: TouchEvent) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };
    const handleTouchMove = (event: TouchEvent) => {
      const start = touchStartYRef.current;
      const current = event.touches[0]?.clientY ?? null;
      if (start !== null && current !== null && current - start > 35 && window.scrollY <= 0) {
        triggerMobileNav();
      }
    };
    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [triggerMobileNav]);

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
          0% { transform: scale(1.0); opacity: 0.75; }
          ${inhalePercent}% { transform: scale(${circleScale}); opacity: 1; }
          ${holdPercent}% { transform: scale(${circleScale}); opacity: 1; }
          100% { transform: scale(1.0); opacity: 0.75; }
        }
        .qs-switch { position: relative; display: inline-flex; align-items: center; }
        .qs-switch input { appearance: none; width: 44px; height: 26px; border-radius: 999px; background: #d1d5db; transition: background 0.2s ease; position: relative; outline: none; cursor: pointer; }
        .qs-switch input:checked { background: #34c759; }
        .qs-switch input::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 999px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s ease; }
        .qs-switch input:checked::after { transform: translateX(18px); }
        .qs-slider { display: none; }
        .qs-mobile-nav { position: fixed; left: 16px; right: 16px; bottom: 20px; display: flex; justify-content: space-around; gap: 12px; padding: 12px 16px; border-radius: 20px; background: var(--qs-card); backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(15,23,42,0.16); border: 1px solid var(--qs-border); }
        .qs-mobile-nav button { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; color: var(--qs-text); }
        .qs-mobile-nav .active { color: var(--qs-accent-strong); }
      `}</style>
      <div className="mx-auto max-w-5xl px-6 py-10 md:py-16">
        <header className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {t.title}
          </h1>
          <div className="hidden items-center gap-2 md:flex">
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
        </header>

        <div className="mt-24 mb-20 flex justify-center">
          <button
            type="button"
            onClick={toggleSession}
            className="relative flex items-center justify-center rounded-full bg-[color:var(--qs-accent-soft-2)] text-center shadow-inner transition"
            style={{
              width: `${displayCircleSize}px`,
              height: `${displayCircleSize}px`,
              transform: `scale(${phaseScale})`,
              transition: "transform 0.2s linear",
              transformOrigin: "center",
              animation: "none",
            }}
          >
            <div className="flex flex-col items-center justify-center gap-1 px-6">
              <span className="text-xl font-semibold text-[color:var(--qs-text)] md:text-2xl">
                {sessionRunning && guideEnabled ? phaseLabel : sessionRunning ? t.stop : t.start}
              </span>
              {sessionRunning && guideEnabled && phaseRemaining !== null && (
                <span className="text-2xl font-semibold text-[color:var(--qs-text)] md:text-3xl">
                  {phaseRemaining}
                </span>
              )}
            </div>
          </button>
        </div>

        <main className="mt-10 grid gap-6 md:grid-cols-3">
          <section className="rounded-3xl bg-[color:var(--qs-card)] p-6 shadow-sm md:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t.breathe}</h2>
                <p className="mt-2 text-sm text-[color:var(--qs-text-muted)]">{t.breatheTip}</p>
              </div>
              <label className="qs-switch">
                <input
                  type="checkbox"
                  checked={guideEnabled}
                  onChange={(e) => {
                    const next = e.target.checked;
                    if (next) {
                      disableMeditation();
                    }
                    setGuideEnabled(next);
                    if (!next) {
                      clearCues();
                      return;
                    }
                    const fallback = presets[0].id;
                    const last = lastGuideRef.current;
                    const chosen =
                      last && (last === "custom" || presets.some((preset) => preset.id === last))
                        ? last
                        : fallback;
                    setRhythmId(chosen);
                  }}
                />
                <span className="qs-slider" />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setGuideEnabled(true);
                    setRhythmId(preset.id);
                    lastGuideRef.current = preset.id;
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    guideEnabled && rhythmId === preset.id
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
                onClick={() => {
                  setGuideEnabled(true);
                  setRhythmId("custom");
                  lastGuideRef.current = "custom";
                }}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  guideEnabled && rhythmId === "custom"
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


            {guideEnabled && rhythmId === "custom" && (
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

          </section>

          <section className="rounded-3xl bg-[color:var(--qs-card)] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t.timer}</h2>
                <p className="mt-2 text-sm text-[color:var(--qs-text-muted)]">{t.timerTip}</p>
              </div>
              <label className="qs-switch">
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => {
                    const next = e.target.checked;
                    if (next) {
                      disableMeditation();
                    }
                    setTimerEnabled(next);
                    if (!next) {
                      setTimerMinutes(null);
                      return;
                    }
                    const fallback = minuteOptions[0].value;
                    const chosen = lastTimerRef.current ?? timerMinutes ?? fallback;
                    setTimerMinutes(chosen);
                  }}
                />
                <span className="qs-slider" />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {minuteOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setTimerEnabled(true);
                    setTimerMinutes(option.value);
                    lastTimerRef.current = option.value;
                  }}
                  className={`rounded-2xl border px-3 py-2 text-sm transition ${
                    timerEnabled && timerMinutes === option.value
                      ? "border-[color:var(--qs-accent-border)] bg-[color:var(--qs-accent-soft)] text-[color:var(--qs-accent-strong)]"
                      : "border-[color:var(--qs-border)] text-[color:var(--qs-text-muted)] hover:border-[color:var(--qs-accent-border)]"
                  }`}
                >
                  {lang === "zh" ? option.labelZh : option.labelEn}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[color:var(--qs-panel-bg)] px-4 py-3 text-center">
              <div className="text-2xl font-semibold">
                {timerRunning ? formatTime(remaining) : "--:--"}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-[color:var(--qs-card)] p-6 shadow-sm md:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t.noise}</h2>
                <p className="mt-2 text-sm text-[color:var(--qs-text-muted)]">{t.noiseTip}</p>
              </div>
              <label className="qs-switch">
                <input
                  type="checkbox"
                  checked={noiseEnabled}
                  onChange={(e) => {
                    const next = e.target.checked;
                    if (next) {
                      disableMeditation();
                    }
                    setNoiseEnabled(next);
                    if (!next) {
                      stopNoise();
                      return;
                    }
                    const fallback = noiseOptions[0];
                    const last = lastNoiseRef.current;
                    const chosen = last && noiseOptions.includes(last) ? last : fallback;
                    setNoiseType(chosen);
                  }}
                />
                <span className="qs-slider" />
              </label>
            </div>

            <audio ref={ambientAudioRef} loop preload="auto" className="hidden" />

            <div className="mt-5 flex flex-wrap gap-3">
              {noiseOptions.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setNoiseEnabled(true);
                    setNoiseType(type as NoiseType);
                    lastNoiseRef.current = type as NoiseType;
                  }}
                  className={`rounded-full px-5 py-2 text-sm transition ${
                    noiseEnabled && noiseType === type
                      ? "bg-[color:var(--qs-accent)] text-[color:var(--qs-button-text)]"
                      : "border border-[color:var(--qs-border)] text-[color:var(--qs-text-secondary)] hover:border-[color:var(--qs-accent-border)]"
                  }`}
                >
                  {noiseLabels[type]}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-[color:var(--qs-card)] p-6 shadow-sm md:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t.meditation}</h2>
              </div>
              <label className="qs-switch">
                <input
                  type="checkbox"
                  checked={meditationEnabled}
                  onChange={(e) => handleMeditationToggle(e.target.checked)}
                />
                <span className="qs-slider" />
              </label>
            </div>

            <div className="mt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {meditationTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => toggleMeditationPlayback(track.voiceSrc, track.id)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      meditationPlaying && activeMeditationId === track.id
                        ? "border-[color:var(--qs-accent-border)] bg-[color:var(--qs-accent-soft)] text-[color:var(--qs-accent-strong)]"
                        : "border-[color:var(--qs-border)] text-[color:var(--qs-text-muted)] hover:border-[color:var(--qs-accent-border)]"
                    }`}
                  >
                    <div className="font-medium">{track.label}</div>
                    <div className="text-xs text-[color:var(--qs-text-soft)]">{t.meditationHint}</div>
                  </button>
                ))}
              </div>
            </div>

            <audio ref={meditationVoiceRef} preload="auto" className="hidden" />
            <audio ref={meditationBedRef} preload="auto" className="hidden" src="/audio/meditation-bed.mp3" />
          </section>

        </main>

        {showMobileNav && (
          <div className="qs-mobile-nav md:hidden">
            <button
              type="button"
              onClick={() => {
                cycleTheme();
                triggerMobileNav();
              }}
              className="active"
            >
              <span className="text-base">{themeIcons[themeMode].icon}</span>
              <span>
                {themeMode === "system"
                  ? t.themeSystem
                  : themeMode === "day"
                    ? t.themeDay
                    : t.themeNight}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                toggleLang();
                triggerMobileNav();
              }}
            >
              <span className="text-base">{lang === "zh" ? "中" : "EN"}</span>
              <span>{lang === "zh" ? "中文" : "English"}</span>
            </button>
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-[color:var(--qs-text-soft)]">
          {t.footer}
        </footer>
      </div>
    </div>
  );
}
