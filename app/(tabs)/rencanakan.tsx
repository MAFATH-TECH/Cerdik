import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import CerdikButton from "@/components/ui/CerdikButton";
import CerdikCard from "@/components/ui/CerdikCard";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { ScreenError, ScreenLoading } from "@/components/ui/ScreenState";
import { CERDIK_COLORS } from "../../constants/colors";
import { Goal, useGoalStore } from "../../stores/useGoalStore";
import { goalService } from "@/services/goalService";

const GOAL_EMOJIS = ["🎮", "📱", "👟", "🎒", "📚", "🎵", "✈️", "💻", "🏸", "🎁"];

const formatRupiah = (amount: number) => `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return "#EF4444";
  if (percentage <= 70) return "#F59E0B";
  return "#22C55E";
};

function AnimatedGoalProgress({ percentage }: { percentage: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: percentage,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [percentage, anim]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ marginTop: 8, height: 10, borderRadius: 999, backgroundColor: "#E2E8F0" }}>
      <Animated.View
        style={{
          width,
          height: 10,
          borderRadius: 999,
          backgroundColor: getProgressColor(percentage),
        }}
      />
    </View>
  );
}

export default function RencanakanScreen() {
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

  const daysLeft = Math.max(
    1,
    Math.ceil((deadline.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)),
  );
  const targetNumber = Number(target || "0");
  const dailyNeed = targetNumber > 0 ? Math.ceil(targetNumber / daysLeft) : 0;

  const resetGoalForm = () => {
    setName("");
    setEmoji("🎯");
    setTarget("");
    setNote("");
    setDeadline(new Date());
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
    const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
    const { daysLeft, dailyNeeded } = goalService.getGoalProgress(goal);
    const dailySave = Math.ceil(dailyNeeded);

    return (
      <CerdikCard key={goal.id} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Text style={{ fontSize: 26, marginRight: 10 }}>{goal.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: CERDIK_COLORS.textPrimary, fontSize: 16, fontWeight: "700" }}>{goal.name}</Text>
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

        <AnimatedGoalProgress percentage={percentage} />

        <Text style={{ marginTop: 8, color: CERDIK_COLORS.textSecondary, fontSize: 12 }}>
          Butuh menabung {formatRupiah(dailySave)}/hari
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <CerdikButton
              title="Tambah Tabungan"
              onPress={() => setSavingModalGoal(goal)}
              variant="primary"
            />
          </View>
          <View style={{ flex: 1 }}>
            <CerdikButton
              title="Lihat Detail"
              onPress={() =>
                Alert.alert(
                  goal.name,
                  `${goal.note || "Tanpa catatan"}\nDeadline: ${new Date(goal.deadline).toLocaleDateString("id-ID")}`,
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
  if (error && goals.length === 0)
    return (
      <ScreenError
        description={error}
        onRetry={() => {
          loadGoals();
        }}
      />
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: CERDIK_COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
            Target Keuanganku
          </Text>
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
            <Text style={{ textAlign: "center", fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>
              Belum ada target
            </Text>
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
                  {goal.emoji} {goal.name}
                </Text>
                <Text style={{ color: "#16A34A", fontWeight: "700" }}>✓ Tercapai</Text>
              </View>
              <Text style={{ marginTop: 4, color: CERDIK_COLORS.textSecondary }}>
                Selesai pada{" "}
                {new Date(goal.completedAt ?? goal.deadline).toLocaleDateString("id-ID")}
              </Text>
            </CerdikCard>
          ))
        )}
      </ScrollView>

      <Modal visible={goalModalVisible} transparent animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
          <View style={{ maxHeight: "90%", borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#FFFFFF", padding: 18 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: CERDIK_COLORS.textPrimary, marginBottom: 10 }}>
              Tambah Goal Baru
            </Text>
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
              onPress={() => setShowDeadlinePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: 12,
                marginBottom: 12,
              }}
            >
              <Text>{deadline.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</Text>
            </Pressable>

            {showDeadlinePicker ? (
              <DateTimePicker
                value={deadline}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowDeadlinePicker(false);
                  if (date) setDeadline(date);
                }}
              />
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

            <CerdikButton title="Simpan Goal" onPress={handleCreateGoal} loading={isLoading} />
            <View style={{ marginTop: 8 }}>
              <CerdikButton
                title="Batal"
                onPress={() => {
                  setGoalModalVisible(false);
                  resetGoalForm();
                }}
                variant="secondary"
              />
            </View>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!savingModalGoal} transparent animationType="fade" onRequestClose={() => setSavingModalGoal(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ width: "100%", borderRadius: 16, backgroundColor: "#FFFFFF", padding: 16 }}>
            <Text style={{ marginBottom: 10, fontSize: 16, fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
              Tambah Tabungan
            </Text>
            <CurrencyInput label="Nominal Tabungan" value={savingAmount} onChange={setSavingAmount} />
            <CerdikButton title="Simpan Tabungan" onPress={handleAddSaving} loading={isLoading} />
            <View style={{ marginTop: 8 }}>
              <CerdikButton title="Batal" onPress={() => setSavingModalGoal(null)} variant="secondary" />
            </View>
          </View>
        </View>
      </Modal>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
