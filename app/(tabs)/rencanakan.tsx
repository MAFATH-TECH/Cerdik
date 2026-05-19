import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { ScreenError, ScreenLoading } from "@/components/ui/ScreenState";
import { CERDIK_COLORS } from "../../constants/colors";
import { Goal, useGoalStore } from "../../stores/useGoalStore";
import { goalService } from "@/services/goalService";

/**
 * JANGAN `import` DateTimePicker di level modul. Di Expo Go + iOS, inisialisasi native
 * saat tab pertama kali di-load sering bikin layar hitam tanpa redbox.
 * Muat lewat require() hanya saat picker benar-benar dirender.
 */
function AndroidDeadlinePicker(props: {
  value: Date;
  onChange: (event: { type?: string } | undefined, date?: Date) => void;
}) {
  const DateTimePicker = require("@react-native-community/datetimepicker").default;
  return <DateTimePicker value={props.value} mode="date" display="default" onChange={props.onChange} />;
}

function IOSDeadlineSpinner(props: { value: Date; onChange: (d: Date) => void }) {
  const DateTimePicker = require("@react-native-community/datetimepicker").default;
  return (
    <DateTimePicker
      value={props.value}
      mode="date"
      display="spinner"
      themeVariant="light"
      onChange={(_e: unknown, d?: Date) => {
        if (d) props.onChange(d);
      }}
    />
  );
}

const GOAL_EMOJIS = ["🎮", "📱", "👟", "🎒", "📚", "🎵", "✈️", "💻", "🏸", "🎁"];

const IOS_SPINNER_HEIGHT = 216;

const formatRupiah = (amount: number) => {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
  } catch {
    return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
  }
};

const clampPercent = (n: number) => {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
};

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return CERDIK_COLORS.danger;
  if (percentage <= 70) return CERDIK_COLORS.warning;
  return CERDIK_COLORS.success;
};

function StaticGoalProgress({ percentage }: { percentage: number }) {
  const safePct = clampPercent(Math.round(percentage));

  return (
    <View style={{ marginTop: 8, height: 10, borderRadius: 999, backgroundColor: "#E2E8F0", overflow: "hidden" }}>
      <View
        style={{
          width: `${safePct}%`,
          height: 10,
          borderRadius: 999,
          backgroundColor: getProgressColor(safePct),
        }}
      />
    </View>
  );
}

function RencanakanScreenInner() {
  const { goals, loadGoals, createGoal, addContribution, isLoading, error } = useGoalStore();
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [savingModalGoal, setSavingModalGoal] = useState<Goal | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [savingAmount, setSavingAmount] = useState("");

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const activeGoals = useMemo(() => goals.filter((goal) => !goal.isCompleted), [goals]);
  const completedGoals = useMemo(() => goals.filter((goal) => goal.isCompleted), [goals]);

  const daysLeft = useMemo(() => {
    const d = deadline.getTime();
    if (!Number.isFinite(d)) return 1;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d - start.getTime()) / (1000 * 60 * 60 * 24));
    return Number.isFinite(diff) ? Math.max(1, diff) : 1;
  }, [deadline]);
  const targetNumber = Number(target || "0");
  const dailyNeed = targetNumber > 0 ? Math.ceil(targetNumber / daysLeft) : 0;

  const resetGoalForm = () => {
    setName("");
    setEmoji("🎯");
    setTarget("");
    setNote("");
    setDeadline(new Date());
    setShowDeadlinePicker(false);
  };

  const handleCreateGoal = async () => {
    const targetAmount = Number(target);
    if (!name.trim() || !targetAmount) {
      Alert.alert("Data belum lengkap", "Nama goal dan target nominal wajib diisi.");
      return;
    }
    await createGoal({
      name: name.trim(),
      emoji,
      target_amount: targetAmount,
      deadline: deadline.toISOString(),
      note: note.trim() || undefined,
    });
    resetGoalForm();
    setGoalModalVisible(false);
  };

  const handleAddSaving = async () => {
    const amount = Number(savingAmount);
    if (!savingModalGoal || !amount) {
      Alert.alert("Nominal kosong", "Masukkan nominal tabungan terlebih dahulu.");
      return;
    }
    await addContribution(savingModalGoal.id, amount);
    setSavingAmount("");
    setSavingModalGoal(null);
  };

  const renderGoalCard = (goal: Goal) => {
    const rawPct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const percentage = clampPercent(Math.round(rawPct));
    const { dailyNeeded } = goalService.getGoalProgress(goal);
    const dailySave = Number.isFinite(dailyNeeded) ? Math.max(0, Math.ceil(dailyNeeded)) : 0;
    const title = goal.name?.trim() ? goal.name : "Tanpa nama";
    const noteLine = goal.note?.trim() ? goal.note : "Tanpa catatan";

    return (
      <CerdikCard key={goal.id} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Text style={{ fontSize: 26, marginRight: 10 }}>{goal.emoji ?? "🎯"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: CERDIK_COLORS.textPrimary, fontSize: 16, fontWeight: "700" }}>{title}</Text>
              <Text style={{ marginTop: 2, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
                Target: {formatRupiah(goal.targetAmount)}
              </Text>
              <Text style={{ marginTop: 2, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
                Terkumpul: {formatRupiah(goal.currentAmount)}
              </Text>
            </View>
          </View>
          <Text style={{ color: getProgressColor(percentage), fontWeight: "700" }}>{percentage}%</Text>
        </View>

        <StaticGoalProgress percentage={percentage} />

        <Text style={{ marginTop: 8, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
          Butuh menabung {formatRupiah(dailySave)}/hari
        </Text>

        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <CerdikButton title="Tambah Tabungan" onPress={() => setSavingModalGoal(goal)} variant="primary" />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <CerdikButton
              title="Lihat Detail"
              onPress={() =>
                Alert.alert(
                  title,
                  `${noteLine}\nDeadline: ${new Date(goal.deadline).toLocaleDateString("id-ID")}`,
                )
              }
              variant="secondary"
            />
          </View>
        </View>
      </CerdikCard>
    );
  };

  if (isLoading && goals.length === 0) return <ScreenLoading />;

  if (error && goals.length === 0) {
    return (
      <ScreenError
        description={error}
        onRetry={() => {
          loadGoals();
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerStyle={{ padding: 20, paddingBottom: 120, flexGrow: 1 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>Target Keuanganku</Text>
          <Pressable
            onPress={() => setGoalModalVisible(true)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CERDIK_COLORS.primary,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "700" }}>+</Text>
          </Pressable>
        </View>

        {activeGoals.length === 0 ? (
          <CerdikCard>
            <Text style={{ fontSize: 44, textAlign: "center", marginBottom: 10 }}>🎯</Text>
            <Text style={{ textAlign: "center", fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>Belum ada target</Text>
            <Text style={{ marginTop: 6, textAlign: "center", color: CERDIK_COLORS.textSecondary }}>
              Buat goal pertama kamu, lalu isi tabungan pelan-pelan sampai tercapai.
            </Text>
            <View style={{ marginTop: 12 }}>
              <CerdikButton title="Tambah Goal" onPress={() => setGoalModalVisible(true)} />
            </View>
          </CerdikCard>
        ) : (
          activeGoals.map(renderGoalCard)
        )}

        <Text style={{ marginTop: 8, marginBottom: 10, fontSize: 18, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
          Goal Selesai
        </Text>
        {completedGoals.length === 0 ? (
          <CerdikCard style={{ backgroundColor: "#F1F5F9" }}>
            <Text style={{ color: CERDIK_COLORS.textSecondary }}>Belum ada goal yang tercapai.</Text>
          </CerdikCard>
        ) : (
          completedGoals.map((goal) => (
            <CerdikCard key={goal.id} style={{ marginBottom: 10, backgroundColor: "#F1F5F9" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "700" }}>
                  {goal.emoji ?? "🎯"} {goal.name?.trim() ? goal.name : "Tanpa nama"}
                </Text>
                <Text style={{ color: CERDIK_COLORS.success, fontWeight: "700" }}>✓ Tercapai</Text>
              </View>
              <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>
                Selesai pada {new Date(goal.completedAt ?? goal.deadline).toLocaleDateString("id-ID")}
              </Text>
            </CerdikCard>
          ))
        )}
      </ScrollView>

      {goalModalVisible ? (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowDeadlinePicker(false);
            setGoalModalVisible(false);
            resetGoalForm();
          }}
        >
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
              <Pressable
                style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.35)" }]}
                onPress={() => {
                  setShowDeadlinePicker(false);
                  setGoalModalVisible(false);
                  resetGoalForm();
                }}
              />

              <View
                style={{
                  width: "100%",
                  maxHeight: "92%",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  backgroundColor: "#FFFFFF",
                  overflow: "hidden",
                }}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                  contentContainerStyle={{ padding: 18, paddingBottom: 36, flexGrow: 1 }}
                >
                  <ModalGoalForm
                    name={name}
                    setName={setName}
                    emoji={emoji}
                    setEmoji={setEmoji}
                    target={target}
                    setTarget={setTarget}
                    note={note}
                    setNote={setNote}
                    deadline={deadline}
                    showDeadlinePicker={showDeadlinePicker}
                    setDeadline={setDeadline}
                    setShowDeadlinePicker={setShowDeadlinePicker}
                    dailyNeed={dailyNeed}
                    onSave={handleCreateGoal}
                    onCancel={() => {
                      setGoalModalVisible(false);
                      resetGoalForm();
                    }}
                    isLoading={isLoading}
                  />
                </ScrollView>
              </View>

              {showDeadlinePicker && Platform.OS === "android" ? (
                <View style={[StyleSheet.absoluteFillObject, { zIndex: 20, elevation: 24 }]} pointerEvents="box-none">
                  <Pressable
                    style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.4)" }]}
                    onPress={() => setShowDeadlinePicker(false)}
                  />
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "#FFFFFF",
                      borderTopLeftRadius: 18,
                      borderTopRightRadius: 18,
                      paddingTop: 10,
                      paddingBottom: 20,
                      paddingHorizontal: 16,
                      minHeight: 320,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <Pressable onPress={() => setShowDeadlinePicker(false)} style={{ paddingVertical: 8, paddingHorizontal: 8 }}>
                        <Text style={{ color: CERDIK_COLORS.textSecondary, fontWeight: "700" }}>Batal</Text>
                      </Pressable>
                      <Text style={{ color: CERDIK_COLORS.textPrimary, fontWeight: "800" }}>Pilih Tanggal</Text>
                      <Pressable onPress={() => setShowDeadlinePicker(false)} style={{ paddingVertical: 8, paddingHorizontal: 8 }}>
                        <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "800" }}>Selesai</Text>
                      </Pressable>
                    </View>
                    <AndroidDeadlinePicker
                      value={deadline}
                      onChange={(event, date) => {
                        setShowDeadlinePicker(false);
                        if (event?.type !== "dismissed" && date) setDeadline(date);
                      }}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}

      {savingModalGoal ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSavingModalGoal(null)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <View style={{ width: "100%", maxWidth: 440, borderRadius: 16, backgroundColor: "#FFFFFF", padding: 16 }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
                    Tambah Tabungan
                  </Text>
                  <CurrencyInput label="Nominal Tabungan" value={savingAmount} onChange={setSavingAmount} />
                  <CerdikButton title="Simpan Tabungan" onPress={handleAddSaving} loading={isLoading} />
                  <View style={{ marginTop: 8 }}>
                    <CerdikButton title="Batal" onPress={() => setSavingModalGoal(null)} variant="secondary" />
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </View>
  );
}

type ModalGoalFormProps = {
  name: string;
  setName: (s: string) => void;
  emoji: string;
  setEmoji: (s: string) => void;
  target: string;
  setTarget: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  deadline: Date;
  showDeadlinePicker: boolean;
  setDeadline: (d: Date) => void;
  setShowDeadlinePicker: (v: boolean) => void;
  dailyNeed: number;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

function ModalGoalForm({
  name,
  setName,
  emoji,
  setEmoji,
  target,
  setTarget,
  note,
  setNote,
  deadline,
  showDeadlinePicker,
  setDeadline,
  setShowDeadlinePicker,
  dailyNeed,
  onSave,
  onCancel,
  isLoading,
}: ModalGoalFormProps) {
  return (
    <>
      <Text style={{ fontSize: 18, fontWeight: "700", color: CERDIK_COLORS.textPrimary, marginBottom: 10 }}>Tambah Goal Baru</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nama goal (contoh: Beli Sepatu Nike)"
        style={{
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 12,
        }}
      />

      <Text style={{ marginBottom: 8, color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>Pilih Emoji</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
        {GOAL_EMOJIS.map((item) => {
          const selected = item === emoji;
          return (
            <Pressable
              key={item}
              onPress={() => setEmoji(item)}
              style={{
                width: "20%",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected ? CERDIK_COLORS.primary : "#F8FAFC",
                }}
              >
                <Text style={{ fontSize: 22 }}>{item}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <CurrencyInput label="Target Nominal" value={target} onChange={setTarget} />

      <Text style={{ marginBottom: 8, color: CERDIK_COLORS.textPrimary, fontWeight: "600" }}>Deadline</Text>
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setShowDeadlinePicker(!showDeadlinePicker);
        }}
        hitSlop={8}
        style={{
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 12,
          marginBottom: showDeadlinePicker && Platform.OS === "ios" ? 8 : 12,
        }}
      >
        <Text style={{ color: CERDIK_COLORS.textPrimary }}>
          {deadline.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
        </Text>
        <Text style={{ marginTop: 6, fontSize: 12, color: CERDIK_COLORS.primary, fontWeight: "700" }}>
          {showDeadlinePicker ? "Tap untuk tutup pemilih tanggal" : "Tap untuk pilih tanggal"}
        </Text>
      </Pressable>

      {showDeadlinePicker && Platform.OS === "ios" ? (
        <View
          style={{
            height: IOS_SPINNER_HEIGHT,
            marginBottom: 12,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: "#F8FAFC",
          }}
        >
          <IOSDeadlineSpinner value={deadline} onChange={setDeadline} />
        </View>
      ) : null}

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Catatan/motivasi (opsional)"
        multiline
        style={{
          minHeight: 70,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 12,
          textAlignVertical: "top",
        }}
      />

      <Text style={{ marginBottom: 14, color: CERDIK_COLORS.textSecondary }}>
        Untuk mencapai target ini, kamu perlu menabung {formatRupiah(dailyNeed)} per hari.
      </Text>

      <CerdikButton title="Simpan Goal" onPress={onSave} loading={isLoading} />
      <View style={{ marginTop: 8 }}>
        <CerdikButton title="Batal" onPress={onCancel} variant="secondary" />
      </View>
    </>
  );
}

export default function RencanakanScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }} edges={["left", "right", "bottom"]}>
      <RencanakanScreenInner />
    </SafeAreaView>
  );
}
