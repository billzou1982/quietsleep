import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { Asset } from "expo-asset";
import enInhale from "./assets/voice/en-inhale.mp3";
import enHold from "./assets/voice/en-hold.mp3";
import enExhale from "./assets/voice/en-exhale.mp3";
import zhInhale from "./assets/voice/zh-inhale.mp3";
import zhHold from "./assets/voice/zh-hold.mp3";
import zhExhale from "./assets/voice/zh-exhale.mp3";
import whiteNoise from "./assets/audio/white.wav";
import pinkNoise from "./assets/audio/pink.wav";

const copy = {
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
    noiseTip: "Voice cues can play together with noise.",
    noiseNone: "None",
    white: "White Noise",
    pink: "Pink Noise",
    volume: "Volume",
    timer: "Sleep Timer",
    timerTip: "Off by default. Choose a duration to enable.",
    minutes: "minutes",
    statusRunning: "Running",
    statusIdle: "Idle",
    statusNotSet: "Not set",
    noTimer: "No timer",
    guide: "Wind-down tips",
    guideItems: [
      "Dim screens and ambient light",
      "Avoid stimulating content 30 mins before bed",
      "Keep the room slightly cool and ventilated",
    ],
  },
  zh: {
    title: "轻眠 · QuietSleep",
    subtitle: "极简、柔和的助眠工具。呼吸引导 + 白/粉红噪音 + 定时关闭。",
    start: "开始",
    stop: "停止",
    breathe: "睡眠引导",
    breatheTip: "选择节奏与时长，圆圈大小随呼吸时间变化。",
    rhythm: "呼吸节奏",
    custom: "自定义",
    inhale: "吸气",
    hold: "屏息",
    exhale: "呼气",
    seconds: "秒",
    noise: "助眠噪音",
    noiseTip: "人声引导可与助眠噪音同时播放。",
    noiseNone: "无噪音",
    white: "白噪音",
    pink: "粉红噪音",
    volume: "音量",
    timer: "定时关闭",
    timerTip: "默认不启用，选择时长后生效。",
    minutes: "分钟",
    statusRunning: "计时中",
    statusIdle: "未启动",
    statusNotSet: "未设置",
    noTimer: "不启用",
    guide: "放松建议",
    guideItems: [
      "调暗屏幕与环境灯光",
      "睡前 30 分钟避免高刺激内容",
      "保持房间略微偏凉、通风",
    ],
  },
};

const presets = [
  { id: "box", zh: "Box 4-4-4", en: "Box 4-4-4", inhale: 4, hold: 4, exhale: 4 },
  { id: "478", zh: "经典 4-7-8", en: "Classic 4-7-8", inhale: 4, hold: 7, exhale: 8 },
  { id: "relax", zh: "舒缓 4-4-6", en: "Relax 4-4-6", inhale: 4, hold: 4, exhale: 6 },
];

const minuteOptions = [10, 15, 20, 30, 45, 60, 90];

const voiceAssets = {
  en: { inhale: enInhale, hold: enHold, exhale: enExhale },
  zh: { inhale: zhInhale, hold: zhHold, exhale: zhExhale },
};

const noiseAssets = {
  white: whiteNoise,
  pink: pinkNoise,
};

export default function App() {
  const [lang, setLang] = useState("en");
  const [rhythmId, setRhythmId] = useState("relax");
  const [customRhythm, setCustomRhythm] = useState({ inhale: 4, hold: 4, exhale: 6 });
  const [noiseType, setNoiseType] = useState("none");
  const [volume, setVolume] = useState(0.2);
  const [timerMinutes, setTimerMinutes] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(false);
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const noiseRef = useRef(null);
  const voiceRef = useRef({ inhale: null, hold: null, exhale: null });
  const timeoutsRef = useRef([]);
  const cycleTimeoutRef = useRef(null);
  const sessionRunningRef = useRef(false);
  const scheduleRef = useRef(() => {});

  const t = useMemo(() => copy[lang], [lang]);

  const rhythm = useMemo(() => {
    if (rhythmId === "custom") return customRhythm;
    return presets.find((item) => item.id === rhythmId) ?? presets[2];
  }, [customRhythm, rhythmId]);

  const circleSize = Math.min(240, 160 + rhythm.inhale * 10);
  const circleScale = Math.min(1.2, 0.85 + rhythm.inhale * 0.04);

  useEffect(() => {
    sessionRunningRef.current = sessionRunning;
  }, [sessionRunning]);

  useEffect(() => {
    if (noiseRef.current) {
      noiseRef.current.setVolumeAsync(volume);
    }
  }, [volume]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startBreathingAnim = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: circleScale,
          duration: rhythm.inhale * 1000,
          useNativeDriver: true,
        }),
        Animated.delay(rhythm.hold * 1000),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: rhythm.exhale * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [circleScale, rhythm.exhale, rhythm.hold, rhythm.inhale, scaleAnim]);

  const stopBreathingAnim = useCallback(() => {
    scaleAnim.stopAnimation();
    scaleAnim.setValue(1);
  }, [scaleAnim]);

  const unloadVoice = useCallback(async () => {
    const current = voiceRef.current;
    await Promise.all(
      [current.inhale, current.hold, current.exhale].map(async (sound) => {
        if (!sound) return;
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {
          // ignore
        }
      })
    );
    voiceRef.current = { inhale: null, hold: null, exhale: null };
  }, []);

  const loadSound = useCallback(async (moduleAsset, volumeLevel) => {
    const asset = Asset.fromModule(moduleAsset);
    await asset.downloadAsync();
    const source = asset.localUri ? { uri: asset.localUri } : moduleAsset;
    const { sound } = await Audio.Sound.createAsync(source, { volume: volumeLevel });
    return sound;
  }, []);

  const ensureVoice = useCallback(async () => {
    await unloadVoice();
    const pack = voiceAssets[lang];
    const inhale = await loadSound(pack.inhale, 0.9);
    const hold = await loadSound(pack.hold, 0.9);
    const exhale = await loadSound(pack.exhale, 0.9);
    voiceRef.current = { inhale, hold, exhale };
  }, [lang, loadSound, unloadVoice]);

  const ensureNoise = useCallback(async () => {
    if (noiseType === "none") return;
    const asset = noiseType === "white" ? noiseAssets.white : noiseAssets.pink;
    const sound = await Audio.Sound.createAsync(asset, { volume, isLooping: true });
    noiseRef.current = sound.sound;
    await noiseRef.current.playAsync();
  }, [noiseType, volume]);

  const stopNoise = useCallback(async () => {
    if (!noiseRef.current) return;
    await noiseRef.current.stopAsync();
    await noiseRef.current.unloadAsync();
    noiseRef.current = null;
  }, []);

  const playVoice = async (type) => {
    const sound = voiceRef.current[type];
    if (!sound) return;
    try {
      await sound.stopAsync();
      await sound.playAsync();
    } catch {
      // ignore
    }
  };

  const clearCues = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
  }, []);

  const scheduleBreathCycle = useCallback(() => {
    clearCues();
    const inhaleMs = rhythm.inhale * 1000;
    const holdMs = rhythm.hold * 1000;
    const exhaleMs = rhythm.exhale * 1000;

    playVoice("inhale");
    timeoutsRef.current.push(setTimeout(() => playVoice("hold"), inhaleMs));
    timeoutsRef.current.push(setTimeout(() => playVoice("exhale"), inhaleMs + holdMs));

    cycleTimeoutRef.current = setTimeout(() => {
      if (sessionRunningRef.current) scheduleRef.current();
    }, inhaleMs + holdMs + exhaleMs);
  }, [clearCues, rhythm.exhale, rhythm.hold, rhythm.inhale]);

  const stopSession = useCallback(async () => {
    setSessionRunning(false);
    sessionRunningRef.current = false;
    setTimerRunning(false);
    setRemaining(0);
    clearCues();
    stopBreathingAnim();
    await stopNoise();
  }, [clearCues, stopBreathingAnim, stopNoise]);

  useEffect(() => {
    scheduleRef.current = scheduleBreathCycle;
  }, [scheduleBreathCycle]);

  useEffect(() => {
    if (!sessionRunning) {
      voiceRef.current = { inhale: null, hold: null, exhale: null };
      return;
    }
    ensureVoice()
      .then(() => {
        scheduleBreathCycle();
      })
      .catch(() => {
        // keep session running even if voice fails
      });
  }, [ensureVoice, scheduleBreathCycle, sessionRunning]);

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stopSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stopSession, timerRunning]);

  const startSession = useCallback(async () => {
    if (sessionRunning) return;
    setSessionRunning(true);
    sessionRunningRef.current = true;
    startBreathingAnim();
    if (timerMinutes) {
      setRemaining(timerMinutes * 60);
      setTimerRunning(true);
    }

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    await ensureVoice();
    await ensureNoise();

    scheduleBreathCycle();
  }, [ensureNoise, ensureVoice, scheduleBreathCycle, sessionRunning, startBreathingAnim, timerMinutes]);

  const toggleSession = () => {
    if (sessionRunning) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.langSwitcher}>
              <Pressable
                style={[styles.langButton, lang === "en" && styles.langButtonActive]}
                onPress={() => setLang("en")}
              >
                <Text style={[styles.langText, lang === "en" && styles.langTextActive]}>EN</Text>
              </Pressable>
              <Pressable
                style={[styles.langButton, lang === "zh" && styles.langButtonActive]}
                onPress={() => setLang("zh")}
              >
                <Text style={[styles.langText, lang === "zh" && styles.langTextActive]}>CN</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.breathe}</Text>
          <Text style={styles.sectionHint}>{t.breatheTip}</Text>

          <View style={styles.circleWrap}>
            <Animated.View
              style={[
                styles.circle,
                {
                  width: circleSize,
                  height: circleSize,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            />
            <Pressable style={styles.circleButton} onPress={toggleSession}>
              <Text style={styles.circleButtonText}>
                {sessionRunning ? t.stop : t.start}
              </Text>
            </Pressable>
          </View>

          <View style={styles.presetGrid}>
            {presets.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.presetButton, rhythmId === item.id && styles.presetButtonActive]}
                onPress={() => setRhythmId(item.id)}
              >
                <Text style={[styles.presetTitle, rhythmId === item.id && styles.presetTitleActive]}>
                  {lang === "zh" ? item.zh : item.en}
                </Text>
                <Text style={styles.presetMeta}>
                  {t.inhale} {item.inhale}{t.seconds} · {t.hold} {item.hold}{t.seconds} · {t.exhale} {item.exhale}{t.seconds}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.presetButton, rhythmId === "custom" && styles.presetButtonActive]}
              onPress={() => setRhythmId("custom")}
            >
              <Text style={[styles.presetTitle, rhythmId === "custom" && styles.presetTitleActive]}>
                {t.custom}
              </Text>
              <Text style={styles.presetMeta}>
                {t.inhale} {customRhythm.inhale}{t.seconds} · {t.hold} {customRhythm.hold}{t.seconds} · {t.exhale} {customRhythm.exhale}{t.seconds}
              </Text>
            </Pressable>
          </View>

          {rhythmId === "custom" && (
            <View style={styles.customBox}>
              {(["inhale", "hold", "exhale"]).map((key) => (
                <View key={key} style={styles.customRow}>
                  <Text style={styles.customLabel}>
                    {key === "inhale" ? t.inhale : key === "hold" ? t.hold : t.exhale}
                  </Text>
                  <View style={styles.sliderRow}>
                    <Slider
                      style={{ flex: 1 }}
                      minimumValue={2}
                      maximumValue={10}
                      step={1}
                      minimumTrackTintColor="#82C9B2"
                      maximumTrackTintColor="#E6E1DC"
                      thumbTintColor="#1F5C4C"
                      value={customRhythm[key]}
                      onValueChange={(value) =>
                        setCustomRhythm((prev) => ({ ...prev, [key]: value }))
                      }
                    />
                    <Text style={styles.customValue}>{customRhythm[key]}{t.seconds}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.timer}</Text>
          <Text style={styles.sectionHint}>{t.timerTip}</Text>
          <View style={styles.timerGrid}>
            {minuteOptions.map((option) => (
              <Pressable
                key={option}
                style={[styles.timerButton, timerMinutes === option && styles.timerButtonActive]}
                onPress={() => setTimerMinutes(option)}
              >
                <Text style={[styles.timerText, timerMinutes === option && styles.timerTextActive]}>
                  {option} {t.minutes}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.timerButton, timerMinutes === null && styles.timerButtonActive]}
              onPress={() => setTimerMinutes(null)}
            >
              <Text style={[styles.timerText, timerMinutes === null && styles.timerTextActive]}>
                {t.noTimer}
              </Text>
            </Pressable>
          </View>
          <View style={styles.timerPanel}>
            <Text style={styles.timerTime}>{timerRunning ? formatTime(remaining) : "--:--"}</Text>
            <Text style={styles.timerStatus}>
              {timerRunning ? t.statusRunning : timerMinutes ? t.statusIdle : t.statusNotSet}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.noise}</Text>
          <Text style={styles.sectionHint}>{t.noiseTip}</Text>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderLabel}>{t.volume}</Text>
            <Slider
              style={{ flex: 1 }}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              minimumTrackTintColor="#82C9B2"
              maximumTrackTintColor="#E6E1DC"
              thumbTintColor="#1F5C4C"
              value={volume}
              onValueChange={(value) => setVolume(value)}
            />
          </View>
          <View style={styles.noiseRow}>
            {["none", "white", "pink"].map((type) => (
              <Pressable
                key={type}
                style={[styles.noiseButton, noiseType === type && styles.noiseButtonActive]}
                onPress={() => setNoiseType(type)}
              >
                <Text style={[styles.noiseText, noiseType === type && styles.noiseTextActive]}>
                  {type === "none" ? t.noiseNone : type === "white" ? t.white : t.pink}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t.guide}</Text>
          {t.guideItems.map((item) => (
            <View key={item} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F7F5F1",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: Platform.OS === "android" ? 18 : 6,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#1F1C19",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#6F6862",
  },
  langSwitcher: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  langButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  langButtonActive: {
    backgroundColor: "#1E1B18",
  },
  langText: {
    fontSize: 12,
    color: "#6F6862",
    fontWeight: "600",
  },
  langTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2B2622",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#7C746D",
  },
  circleWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  circle: {
    borderRadius: 999,
    backgroundColor: "#D9F0E7",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  circleButton: {
    position: "absolute",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: "#1E1B18",
  },
  circleButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  presetGrid: {
    marginTop: 12,
    gap: 10,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  presetButtonActive: {
    borderColor: "#8CCBB6",
    backgroundColor: "#EAF6F1",
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4E4741",
  },
  presetTitleActive: {
    color: "#1F5C4C",
  },
  presetMeta: {
    marginTop: 4,
    fontSize: 11,
    color: "#8A837C",
  },
  customBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DDEDE7",
    backgroundColor: "#F4FBF7",
    gap: 12,
  },
  customRow: {
    gap: 6,
  },
  customLabel: {
    fontSize: 12,
    color: "#5E5852",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customValue: {
    fontSize: 12,
    color: "#5E5852",
    width: 50,
    textAlign: "right",
  },
  timerGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timerButton: {
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timerButtonActive: {
    borderColor: "#8CCBB6",
    backgroundColor: "#EAF6F1",
  },
  timerText: {
    fontSize: 12,
    color: "#5E5852",
  },
  timerTextActive: {
    color: "#1F5C4C",
    fontWeight: "600",
  },
  timerPanel: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "#EAF6F1",
    alignItems: "center",
  },
  timerTime: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2B2622",
  },
  timerStatus: {
    marginTop: 4,
    fontSize: 11,
    color: "#1F5C4C",
  },
  sliderHeader: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#5E5852",
    width: 52,
  },
  noiseRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  noiseButton: {
    borderWidth: 1,
    borderColor: "#E6E1DC",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
  },
  noiseButtonActive: {
    borderColor: "#8CCBB6",
    backgroundColor: "#8CCBB6",
  },
  noiseText: {
    fontSize: 12,
    color: "#5E5852",
  },
  noiseTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    backgroundColor: "#8CCBB6",
  },
  tipText: {
    fontSize: 12,
    color: "#6F6862",
    flex: 1,
  },
});
