import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const rhythmPresets = [
  { id: "box", label: "Box 4-4-4", inhale: 4, hold: 4, exhale: 4 },
  { id: "478", label: "Classic 4-7-8", inhale: 4, hold: 7, exhale: 8 },
  { id: "relax", label: "Relax 4-4-6", inhale: 4, hold: 4, exhale: 6 },
];

const timerOptions = [10, 15, 20, 30, 45, 60, 90];

export default function App() {
  const [language, setLanguage] = useState("en");
  const [presetId, setPresetId] = useState("relax");
  const [timerMinutes, setTimerMinutes] = useState(null);
  const [pushToken, setPushToken] = useState("");
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const preset = useMemo(
    () => rhythmPresets.find((item) => item.id === presetId) ?? rhythmPresets[2],
    [presetId]
  );

  const startBreathing = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: preset.inhale * 1000,
          useNativeDriver: true,
        }),
        Animated.delay(preset.hold * 1000),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: preset.exhale * 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [preset.exhale, preset.hold, preset.inhale, scaleAnim]);

  const stopBreathing = useCallback(() => {
    scaleAnim.stopAnimation();
    scaleAnim.setValue(1);
  }, [scaleAnim]);

  const registerForPushNotificationsAsync = useCallback(async () => {
    if (!Device.isDevice) {
      alert("Push notifications require a physical device.");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Notification permission not granted.");
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    setPushToken(token.data);

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  }, []);

  return (
    <View style={styles.page}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>QuietSleep</Text>
            <Text style={styles.subtitle}>
              Minimal, gentle sleep aid with breathing, noise, and timer.
            </Text>
          </View>
          <View style={styles.langSwitcher}>
            <Pressable
              style={[
                styles.langButton,
                language === "zh" && styles.langButtonActive,
              ]}
              onPress={() => setLanguage("zh")}
            >
              <Text
                style={[
                  styles.langText,
                  language === "zh" && styles.langTextActive,
                ]}
              >
                中文
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.langButton,
                language === "en" && styles.langButtonActive,
              ]}
              onPress={() => setLanguage("en")}
            >
              <Text
                style={[
                  styles.langText,
                  language === "en" && styles.langTextActive,
                ]}
              >
                EN
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Breathing rhythm</Text>
          <Text style={styles.sectionHint}>
            Inhale {preset.inhale}s · Hold {preset.hold}s · Exhale {preset.exhale}s
          </Text>
          <View style={styles.presetGrid}>
            {rhythmPresets.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.presetButton,
                  presetId === item.id && styles.presetButtonActive,
                ]}
                onPress={() => setPresetId(item.id)}
              >
                <Text
                  style={[
                    styles.presetTitle,
                    presetId === item.id && styles.presetTitleActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text style={styles.presetMeta}>
                  {item.inhale}s · {item.hold}s · {item.exhale}s
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.circleWrap}>
            <Animated.View
              style={[
                styles.circle,
                {
                  width: 180 + preset.inhale * 8,
                  height: 180 + preset.inhale * 8,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            />
          </View>
          <View style={styles.row}>
            <Pressable style={styles.primaryButton} onPress={startBreathing}>
              <Text style={styles.primaryButtonText}>Start</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={stopBreathing}>
              <Text style={styles.secondaryButtonText}>Stop</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sleep timer</Text>
          <Text style={styles.sectionHint}>
            {timerMinutes ? `${timerMinutes} minutes selected` : "No timer"}
          </Text>
          <View style={styles.timerGrid}>
            {timerOptions.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.timerButton,
                  timerMinutes === option && styles.timerButtonActive,
                ]}
                onPress={() => setTimerMinutes(option)}
              >
                <Text
                  style={[
                    styles.timerText,
                    timerMinutes === option && styles.timerTextActive,
                  ]}
                >
                  {option}m
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[
                styles.timerButton,
                timerMinutes === null && styles.timerButtonActive,
              ]}
              onPress={() => setTimerMinutes(null)}
            >
              <Text
                style={[
                  styles.timerText,
                  timerMinutes === null && styles.timerTextActive,
                ]}
              >
                Off
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Push notifications</Text>
          <Text style={styles.sectionHint}>
            Register the device to receive gentle reminders.
          </Text>
          <Pressable style={styles.primaryButton} onPress={registerForPushNotificationsAsync}>
            <Text style={styles.primaryButtonText}>Enable notifications</Text>
          </Pressable>
          {pushToken ? (
            <Text style={styles.tokenText} selectable>
              Expo token: {pushToken}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F9F7F4",
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#201D1A",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B655F",
    marginTop: 6,
    maxWidth: 240,
  },
  langSwitcher: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  langButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  langButtonActive: {
    backgroundColor: "#1E1B18",
  },
  langText: {
    fontSize: 12,
    color: "#6B655F",
    fontWeight: "500",
  },
  langTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2722",
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#7A736C",
  },
  presetGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  presetButton: {
    borderWidth: 1,
    borderColor: "#E5E1DD",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  presetButtonActive: {
    borderColor: "#84C9B2",
    backgroundColor: "#E7F6EF",
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4E4741",
  },
  presetTitleActive: {
    color: "#1C5B4A",
  },
  presetMeta: {
    marginTop: 4,
    fontSize: 11,
    color: "#8C857D",
  },
  circleWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  circle: {
    borderRadius: 200,
    backgroundColor: "#D9F0E7",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#1E1B18",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E1DD",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4E4741",
    fontWeight: "600",
  },
  timerGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timerButton: {
    borderWidth: 1,
    borderColor: "#E5E1DD",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  timerButtonActive: {
    borderColor: "#84C9B2",
    backgroundColor: "#E7F6EF",
  },
  timerText: {
    fontSize: 12,
    color: "#5C564F",
  },
  timerTextActive: {
    color: "#1C5B4A",
    fontWeight: "600",
  },
  tokenText: {
    marginTop: 12,
    fontSize: 11,
    color: "#5C564F",
  },
});
