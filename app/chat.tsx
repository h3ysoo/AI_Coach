import {
  Text, View, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Modal, Pressable, StatusBar,
  Platform, LayoutAnimation, UIManager, Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:         "#0D1911",
  surface:    "#111F15",
  raised:     "#162B1C",
  active:     "#1C3A26",
  border:     "#1E3527",
  borderGlow: "#2D6B47",
  accent:     "#3DDB6F",
  accentDim:  "#1D5C35",
  accentGlow: "rgba(61,219,111,0.12)",
  white:      "#FFFFFF",
  off:        "#D8EDE1",
  muted:      "#5B8B6A",
  mutedHi:    "#87B898",
  // day colors
  push:       "#FF8A45",
  pull:       "#4FA0F5",
  legs:       "#F05A80",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Exercise = {
  name: string; sets: number; reps: string;
  note?: string; icon: string;
};
type WorkoutDay = {
  num: string; day: string; shortDay: string;
  focus: string; tag: string; tagIcon: string;
  color: string; exercises: Exercise[];
  isToday?: boolean;
};
type TextMsg = { id: string; type: "text"; text: string; sender: "coach" | "user" };
type PlanMsg = { id: string; type: "plan"; sender: "coach"; plan: WorkoutDay[] };
type Msg = TextMsg | PlanMsg;

// ─── Data ─────────────────────────────────────────────────────────────────────
const PLAN: WorkoutDay[] = [
  {
    num: "01", day: "Monday", shortDay: "MON",
    focus: "Chest + Triceps", tag: "Push", tagIcon: "arrow-up-outline",
    color: C.push, isToday: true,
    exercises: [
      { name: "Barbell Bench Press",    sets: 4, reps: "6–8",   note: "Compound · 3 min rest", icon: "barbell-outline" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10–12", note: "Upper chest focus",      icon: "body-outline" },
      { name: "Cable Fly",              sets: 3, reps: "12–15", note: "Slow eccentric 3s",      icon: "infinite-outline" },
      { name: "Tricep Pushdown",        sets: 3, reps: "12",                                    icon: "fitness-outline" },
      { name: "Overhead Extension",     sets: 2, reps: "15",    note: "Long head emphasis",     icon: "fitness-outline" },
    ],
  },
  {
    num: "02", day: "Tuesday", shortDay: "TUE",
    focus: "Back + Biceps", tag: "Pull", tagIcon: "arrow-down-outline",
    color: C.pull,
    exercises: [
      { name: "Bent Over Row",     sets: 4, reps: "6–8",   note: "Compound · 3 min rest", icon: "barbell-outline" },
      { name: "Lat Pulldown",      sets: 3, reps: "10–12",                                icon: "body-outline" },
      { name: "Seated Cable Row",  sets: 3, reps: "12",    note: "Full stretch at top",   icon: "infinite-outline" },
      { name: "Barbell Curl",      sets: 3, reps: "10",                                   icon: "fitness-outline" },
      { name: "Hammer Curl",       sets: 2, reps: "12",    note: "Alternating arms",      icon: "fitness-outline" },
    ],
  },
  {
    num: "03", day: "Thursday", shortDay: "THU",
    focus: "Legs", tag: "Lower", tagIcon: "walk-outline",
    color: C.legs,
    exercises: [
      { name: "Barbell Squat",       sets: 4, reps: "5–6",  note: "Compound · 4 min rest", icon: "barbell-outline" },
      { name: "Romanian Deadlift",   sets: 3, reps: "10",   note: "Feel the hamstring stretch", icon: "body-outline" },
      { name: "Leg Press",           sets: 3, reps: "12",                                  icon: "infinite-outline" },
      { name: "Leg Curl",            sets: 3, reps: "12",                                  icon: "fitness-outline" },
      { name: "Standing Calf Raise", sets: 4, reps: "15",   note: "Full ROM, pause at top", icon: "fitness-outline" },
    ],
  },
];

const PERSONALITIES = [
  { name: "Lucia", style: "Intense & results-driven", emoji: "🤖" },
  { name: "Maya",  style: "Supportive & steady",      emoji: "🌿" },
  { name: "Arne",  style: "Science-based approach",   emoji: "🔬" },
];

const INIT_MSGS: Msg[] = [
  { id: "1", type: "text", sender: "user",  text: "Can you build me a weekly workout plan?" },
  { id: "2", type: "text", sender: "coach", text: "Here's your 3-day hypertrophy split — compounds first when energy is highest, accessories after. Progressive overload baked in. Tap a day to open the full session." },
  { id: "3", type: "plan", sender: "coach", plan: PLAN },
  { id: "4", type: "text", sender: "user",  text: "This looks solid, let's go!" },
  { id: "5", type: "text", sender: "coach", text: "Adjusted for your recovery level. Log Monday and I'll calibrate weights for week 2." },
];

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const pulse = (a: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(700),
      ])).start();
    anims.forEach((a, i) => pulse(a, i * 160));
  }, []);
  return (
    <View style={st.dots}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={[st.dot, { opacity: a.interpolate({ inputRange: [0,1], outputRange: [0.25,1] }), transform: [{ translateY: a.interpolate({ inputRange: [0,1], outputRange: [0,-4] }) }] }]} />
      ))}
    </View>
  );
}

// ─── Progress ring (simplified) ───────────────────────────────────────────────
function ProgressRing({ done, total }: { done: number; total: number }) {
  return (
    <View style={st.ring}>
      <View style={st.ringInner}>
        <Text style={st.ringNum}>{done}</Text>
        <Text style={st.ringDen}>/{total}</Text>
      </View>
      {/* arc approximation via rotated borders */}
      <View style={[st.ringArc, { borderTopColor: C.accent, borderRightColor: C.accent, transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────
function StatsRow() {
  return (
    <View style={st.statsRow}>
      <View style={st.statChip}>
        <Ionicons name="flame" size={12} color="#FF8A45" />
        <Text style={st.statText}>847 kcal</Text>
      </View>
      <View style={st.statDivider} />
      <View style={st.statChip}>
        <Ionicons name="checkmark-circle" size={12} color={C.accent} />
        <Text style={st.statText}>1 done this week</Text>
      </View>
      <View style={st.statDivider} />
      <View style={st.statChip}>
        <Ionicons name="flash" size={12} color="#F05A80" />
        <Text style={st.statText}>Day 14</Text>
      </View>
    </View>
  );
}

// ─── Day card ─────────────────────────────────────────────────────────────────
function DayCard({ day, isLast }: { day: WorkoutDay; isLast: boolean }) {
  const [open, setOpen] = useState(day.isToday ?? false);
  const toggleScale = useRef(new Animated.Value(1)).current;

  const toggle = () => {
    Animated.sequence([
      Animated.timing(toggleScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(toggleScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    LayoutAnimation.configureNext({
      duration: 260,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    setOpen(v => !v);
  };

  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const isToday = day.isToday;

  return (
    <Animated.View
      style={[
        st.dayCard,
        isToday && st.dayCardToday,
        !isLast && { marginBottom: 8 },
        { transform: [{ scale: toggleScale }] },
      ]}
    >
      {/* Glow border for today */}
      {isToday && <View style={[st.glowBorder, { shadowColor: day.color }]} />}

      <TouchableOpacity style={st.dayHead} onPress={toggle} activeOpacity={0.75}>
        {/* Day icon */}
        <View style={[st.dayIconWrap, { backgroundColor: day.color + "20" }]}>
          <Ionicons name={day.tagIcon as any} size={18} color={day.color} />
        </View>

        {/* Text */}
        <View style={st.dayTextBlock}>
          <View style={st.dayNameRow}>
            <Text style={st.dayName}>{day.day}</Text>
            {isToday && (
              <View style={st.todayBadge}>
                <Text style={st.todayText}>TODAY</Text>
              </View>
            )}
          </View>
          <View style={st.daySubRow}>
            <View style={[st.tagPill, { backgroundColor: day.color + "22" }]}>
              <Text style={[st.tagPillText, { color: day.color }]}>{day.tag}</Text>
            </View>
            <Text style={st.dayFocus}>{day.focus}</Text>
            <Text style={[st.daySets, { color: day.color + "BB" }]}>{totalSets} sets</Text>
          </View>
        </View>

        {/* Chevron */}
        <View style={[st.chevronBox, open && { backgroundColor: day.color + "30" }]}>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={open ? day.color : C.muted} />
        </View>
      </TouchableOpacity>

      {/* Exercise list */}
      {open && (
        <View style={st.exSection}>
          <View style={st.exListDivider} />
          {day.exercises.map((ex, i) => (
            <View key={i} style={[st.exRow, i < day.exercises.length - 1 && st.exRowLine]}>
              <View style={[st.exIconDot, { backgroundColor: day.color + "18" }]}>
                <Ionicons name={ex.icon as any} size={13} color={day.color + "CC"} />
              </View>
              <View style={st.exText}>
                <Text style={st.exName}>{ex.name}</Text>
                {ex.note ? <Text style={st.exNote}>{ex.note}</Text> : null}
              </View>
              <View style={[st.setsBadge, { borderColor: day.color + "40" }]}>
                <Text style={[st.setsNum, { color: day.color }]}>{ex.sets}</Text>
                <Text style={st.setsTimes}>×</Text>
                <Text style={[st.setsReps, { color: C.off }]}>{ex.reps}</Text>
              </View>
            </View>
          ))}

          {/* CTAs */}
          <View style={st.ctaRow}>
            <TouchableOpacity style={[st.ctaPrimary, { backgroundColor: day.color }]} activeOpacity={0.8}>
              <Ionicons name="play" size={14} color={C.bg} />
              <Text style={[st.ctaPrimaryText, { color: C.bg }]}>Start Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.ctaSecondary} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={14} color={C.muted} />
              <Text style={st.ctaSecondaryText}>Log Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan }: { plan: WorkoutDay[] }) {
  return (
    <View style={st.planCard}>
      <View style={st.planTop}>
        <View>
          <Text style={st.planLabel}>WEEK PLAN</Text>
          <Text style={st.planSub}>3 sessions · 15 exercises</Text>
        </View>
        <ProgressRing done={1} total={3} />
      </View>
      <StatsRow />
      <View style={st.planDays}>
        {plan.map((d, i) => <DayCard key={d.day} day={d} isLast={i === plan.length - 1} />)}
      </View>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const p = PERSONALITIES.find(x => x.name === name) ?? PERSONALITIES[0];
  return (
    <View style={st.avatarWrap}>
      <View style={st.avatar}>
        <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
      </View>
      <Text style={st.avatarLabel}>{name}</Text>
    </View>
  );
}

// ─── Picker ───────────────────────────────────────────────────────────────────
function Picker({ visible, current, onSelect, onClose }: {
  visible: boolean; current: string; onSelect: (n: string) => void; onClose: () => void;
}) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={st.overlay} onPress={onClose}>
        <View style={st.sheet}>
          <View style={st.sheetHandle} />
          <Text style={st.sheetTitle}>Choose your coach</Text>
          {PERSONALITIES.map(p => (
            <TouchableOpacity
              key={p.name}
              style={[st.sheetItem, current === p.name && st.sheetItemOn]}
              onPress={() => { onSelect(p.name); onClose(); }}
            >
              <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[st.sheetName, current === p.name && { color: C.accent }]}>{p.name}</Text>
                <Text style={st.sheetSub}>{p.style}</Text>
              </View>
              {current === p.name && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { coach: init } = useLocalSearchParams();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [coach, setCoach]   = useState(typeof init === "string" ? init : "Lucia");
  const [msgs, setMsgs]     = useState<Msg[]>(INIT_MSGS);
  const [input, setInput]   = useState("");
  const [picker, setPicker] = useState(false);
  const [typing, setTyping] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMsgs(m => [...m, { id: Date.now().toString(), type: "text", sender: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { id: (Date.now() + 1).toString(), type: "text", sender: "coach", text: "Got it. I'll factor that in for your next session." }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 1800);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <View style={st.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={st.header}>
        <TouchableOpacity style={st.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={C.off} />
        </TouchableOpacity>

        <TouchableOpacity style={st.coachPill} onPress={() => setPicker(true)}>
          <View style={st.coachPillDot} />
          <Text style={st.coachPillName}>{coach}</Text>
          <Ionicons name="chevron-down" size={12} color={C.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={st.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={C.mutedHi} />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
      >
        {msgs.map(msg => {
          if (msg.type === "plan") {
            return (
              <View key={msg.id} style={st.coachRow}>
                <Avatar name={coach} />
                <View style={{ flex: 1 }}>
                  <PlanCard plan={msg.plan} />
                </View>
              </View>
            );
          }
          if (msg.sender === "user") {
            return (
              <View key={msg.id} style={st.userRow}>
                <View style={st.userBubble}>
                  <Text style={st.userText}>{msg.text}</Text>
                </View>
              </View>
            );
          }
          return (
            <View key={msg.id} style={st.coachRow}>
              <Avatar name={coach} />
              <View style={st.coachBubble}>
                <View style={st.coachBubbleAccent} />
                <Text style={st.coachText}>{msg.text}</Text>
              </View>
            </View>
          );
        })}

        {/* Typing indicator */}
        {typing && (
          <View style={st.coachRow}>
            <Avatar name={coach} />
            <View style={[st.coachBubble, st.typingBubble]}>
              <View style={st.coachBubbleAccent} />
              <TypingDots />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input ── */}
      <View style={st.bar}>
        <TextInput
          style={st.input}
          placeholder={`Ask ${coach} anything…`}
          placeholderTextColor={C.muted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[st.sendBtn, !input.trim() && st.sendBtnOff]}
          onPress={send}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={17} color={input.trim() ? C.bg : C.muted} />
        </TouchableOpacity>
      </View>

      <Picker visible={picker} current={coach} onSelect={setCoach} onClose={() => setPicker(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: C.bg,
    paddingTop: Platform.OS === "android" ? 36 : 54,
  },

  // Header
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingBottom: 12, gap: 10,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  coachPill: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, gap: 8,
  },
  coachPillDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.accent,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 4,
  },
  coachPillName: { flex: 1, fontSize: 13, fontWeight: "700", color: C.off },

  // List
  list: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 24, gap: 12 },

  // Coach row
  coachRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  coachBubble: {
    flex: 1, backgroundColor: C.surface,
    borderRadius: 14, borderTopLeftRadius: 3,
    padding: 13, borderWidth: 1, borderColor: C.border,
    flexDirection: "row", gap: 10,
  },
  coachBubbleAccent: {
    width: 2, borderRadius: 2, backgroundColor: C.accentDim,
    alignSelf: "stretch",
  },
  coachText: { flex: 1, color: C.off, fontSize: 14, lineHeight: 22 },
  typingBubble: { paddingVertical: 16 },

  // User row
  userRow: { alignItems: "flex-end" },
  userBubble: {
    backgroundColor: C.raised, borderRadius: 14, borderBottomRightRadius: 3,
    padding: 13, maxWidth: "76%",
    borderWidth: 1, borderColor: C.border,
  },
  userText: { color: C.off, fontSize: 14, lineHeight: 22, fontWeight: "500" },

  // Typing dots
  dots: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.accent },

  // Avatar
  avatarWrap: { alignItems: "center", gap: 3, paddingTop: 2 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.raised, borderWidth: 1.5, borderColor: C.accentDim,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  avatarLabel: { fontSize: 8, color: C.muted, fontWeight: "700", letterSpacing: 0.8 },

  // Plan card
  planCard: {
    backgroundColor: C.surface,
    borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  planTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  planLabel: { fontSize: 10, fontWeight: "900", color: C.accent, letterSpacing: 2.5 },
  planSub:   { fontSize: 11, color: C.muted, marginTop: 2 },

  // Progress ring
  ring: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  ringArc: {
    position: "absolute", width: 46, height: 46, borderRadius: 23,
    borderWidth: 2.5,
    borderTopColor: C.accent, borderRightColor: C.accent,
    borderBottomColor: C.accentDim, borderLeftColor: C.accentDim,
  },
  ringInner: { flexDirection: "row", alignItems: "baseline" },
  ringNum:   { fontSize: 14, fontWeight: "900", color: C.white },
  ringDen:   { fontSize: 10, fontWeight: "600", color: C.muted },

  // Stats row
  statsRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: 12,
  },
  statChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 11, color: C.mutedHi, fontWeight: "600" },
  statDivider: { width: 1, height: 12, backgroundColor: C.border },

  // Days section
  planDays: { padding: 10 },

  // Day card
  dayCard: {
    backgroundColor: C.raised,
    borderRadius: 12, borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  dayCardToday: {
    borderColor: C.borderGlow,
    backgroundColor: C.active,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  glowBorder: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12, borderWidth: 1, borderColor: C.borderGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8,
  },
  dayHead: {
    flexDirection: "row", alignItems: "center",
    padding: 14, gap: 12,
  },
  dayIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  dayTextBlock: { flex: 1, gap: 5 },
  dayNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dayName: { fontSize: 16, fontWeight: "800", color: C.white, letterSpacing: 0.2 },
  todayBadge: {
    backgroundColor: C.accentDim,
    borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
  },
  todayText: { fontSize: 9, fontWeight: "900", color: C.accent, letterSpacing: 1.2 },
  daySubRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagPill: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  tagPillText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
  dayFocus: { fontSize: 11, color: C.muted, flex: 1 },
  daySets: { fontSize: 11, fontWeight: "700" },
  chevronBox: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.bg, alignItems: "center", justifyContent: "center",
  },

  // Exercise section
  exSection: { paddingHorizontal: 12, paddingBottom: 12 },
  exListDivider: { height: 1, backgroundColor: C.border, marginBottom: 6 },
  exRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, gap: 10,
  },
  exRowLine: { borderBottomWidth: 1, borderBottomColor: C.bg },
  exIconDot: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  exText: { flex: 1, gap: 2 },
  exName: { fontSize: 13, fontWeight: "700", color: C.white },
  exNote: { fontSize: 10, color: C.muted, fontWeight: "500" },
  setsBadge: {
    flexDirection: "row", alignItems: "baseline",
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4, gap: 2,
  },
  setsNum:   { fontSize: 14, fontWeight: "900" },
  setsTimes: { fontSize: 11, color: C.muted },
  setsReps:  { fontSize: 13, fontWeight: "700" },

  // CTAs
  ctaRow: {
    flexDirection: "row", gap: 8, marginTop: 12,
  },
  ctaPrimary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 12, borderRadius: 10,
  },
  ctaPrimaryText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  ctaSecondary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
  },
  ctaSecondaryText: { fontSize: 13, fontWeight: "600", color: C.muted },

  // Input bar
  bar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.surface, gap: 8,
  },
  input: {
    flex: 1, backgroundColor: C.bg,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: C.white,
    borderWidth: 1, borderColor: C.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.accent, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 8,
  },
  sendBtnOff: {
    backgroundColor: C.raised,
    shadowOpacity: 0,
  },

  // Picker
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 10, borderTopWidth: 1, borderColor: C.border,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: "center", marginBottom: 8,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: C.white, marginBottom: 4 },
  sheetItem: {
    flexDirection: "row", alignItems: "center",
    gap: 14, padding: 14, borderRadius: 12,
    backgroundColor: C.raised, borderWidth: 1.5, borderColor: "transparent",
  },
  sheetItemOn: { borderColor: C.accentDim },
  sheetName: { fontSize: 15, fontWeight: "700", color: C.white },
  sheetSub:  { fontSize: 11, color: C.muted, marginTop: 1 },
});
