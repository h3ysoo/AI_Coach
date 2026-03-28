import { Text, View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const QUESTIONS = [
  {
    question: "What's your fitness goal?",
    options: [
      { label: "Lose Weight", icon: "flame-outline" },
      { label: "Build Muscle", icon: "barbell-outline" },
      { label: "Stay Active", icon: "walk-outline" },
    ],
  },
  {
    question: "Where will you train?",
    options: [
      { label: "Home", icon: "home-outline" },
      { label: "Outside", icon: "partly-sunny-outline" },
      { label: "Commercial Gym", icon: "fitness-outline" },
    ],
  },
  {
    question: "What's your experience level?",
    options: [
      { label: "Beginner", icon: "leaf-outline" },
      { label: "Intermediate", icon: "trending-up-outline" },
      { label: "Advanced", icon: "trophy-outline" },
    ],
  },
  {
    question: "What motivation style do you prefer?",
    options: [
      { label: "Push me hard", icon: "thunderstorm-outline" },
      { label: "Keep it gentle", icon: "heart-outline" },
      { label: "Give me the science", icon: "flask-outline" },
    ],
  },
];

const COACHES = [
  { name: "Lucia", style: "Push me hard", emoji: "🤖", color: "#4CAF6B" },
  { name: "Maya", style: "Keep it gentle", emoji: "🌿", color: "#6BBFA3" },
  { name: "Arne", style: "Give me the science", emoji: "🔬", color: "#6B9FBF" },
];

function getSuggestedCoach(answers: string[]) {
  const motivation = answers[3];
  if (motivation === "Push me hard") return COACHES[0];
  if (motivation === "Keep it gentle") return COACHES[1];
  return COACHES[2];
}

const BG = "#1B2D21";
const BG_CARD = "#243A2C";
const BG_OPTION = "#2C4535";
const ACCENT = "#4CAF6B";
const WHITE = "#FFFFFF";
const MUTED = "#8AA08E";
const CREAM = "#F2EDE5";

export default function OnBoardingScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const router = useRouter();

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    setCurrentQuestion(currentQuestion + 1);
  };

  // ── Result screen ──
  if (currentQuestion === QUESTIONS.length) {
    const coach = getSuggestedCoach(answers);
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <View style={styles.resultWrapper}>
          <Text style={styles.resultLabel}>Your perfect coach</Text>

          <View style={[styles.coachCard, { borderColor: coach.color + "55" }]}>
            <View style={[styles.coachAvatarLarge, { backgroundColor: coach.color + "22" }]}>
              <Text style={styles.coachEmojiLarge}>{coach.emoji}</Text>
            </View>
            <Text style={[styles.coachNameLarge, { color: coach.color }]}>{coach.name}</Text>
            <Text style={styles.coachStyleText}>{coach.style}</Text>
          </View>

          <Text style={styles.resultSubtext}>
            Based on your answers, {coach.name} is the perfect match for your training goals.
          </Text>

          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: coach.color }]}
            onPress={() => router.push({ pathname: "/chat", params: { coach: coach.name } })}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Start with {coach.name}</Text>
            <Ionicons name="arrow-forward" size={18} color={WHITE} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.restartBtn} onPress={() => { setCurrentQuestion(0); setAnswers([]); }}>
            <Text style={styles.restartText}>Start over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const q = QUESTIONS[currentQuestion];
  const progress = currentQuestion / QUESTIONS.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.stepLabel}>{currentQuestion + 1} of {QUESTIONS.length}</Text>
        <Text style={styles.questionText}>{q.question}</Text>

        <View style={styles.optionsGrid}>
          {q.options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={styles.optionCard}
              onPress={() => handleAnswer(opt.label)}
              activeOpacity={0.8}
            >
              <View style={styles.optionIconCircle}>
                <Ionicons name={opt.icon as any} size={26} color={ACCENT} />
              </View>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bottom brand */}
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>LUVIT</Text>
        <Text style={styles.brandDot}>·</Text>
        <Text style={styles.brandSub}>AI Fitness Coach</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.OS === "android" ? 32 : 56,
  },
  progressBar: {
    height: 3,
    backgroundColor: "#2C4535",
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 3,
    backgroundColor: ACCENT,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  questionText: {
    fontSize: 26,
    fontWeight: "800",
    color: WHITE,
    lineHeight: 34,
    marginBottom: 36,
    letterSpacing: 0.2,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_OPTION,
    borderRadius: 16,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: "#3A6B4A33",
  },
  optionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: WHITE,
    letterSpacing: 0.2,
  },

  // Result screen
  resultWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 32,
  },
  coachCard: {
    width: 200,
    alignItems: "center",
    backgroundColor: BG_CARD,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  coachAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  coachEmojiLarge: { fontSize: 42 },
  coachNameLarge: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  coachStyleText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
  },
  resultSubtext: {
    fontSize: 15,
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    marginBottom: 16,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: WHITE,
    letterSpacing: 0.3,
  },
  restartBtn: { padding: 12 },
  restartText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "600",
  },

  // Brand footer
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 24,
  },
  brandText: {
    fontSize: 13,
    fontWeight: "900",
    color: ACCENT,
    letterSpacing: 3,
  },
  brandDot: { color: MUTED, fontSize: 16 },
  brandSub: { fontSize: 12, color: MUTED, fontWeight: "500", letterSpacing: 0.5 },
});
