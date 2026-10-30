import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";

import { CERDIK_COLORS } from "@/constants/colors";
import { MAX_ACCOUNTS, SavedAccount } from "@/services/accountStorage";
import { useAccountStore } from "@/stores/useAccountStore";
import { displayPhone } from "@/utils/phoneValidator";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AccountSwitcherSheet({ visible, onClose }: Props) {
  const accounts = useAccountStore((s) => s.accounts);
  const activeUserId = useAccountStore((s) => s.activeUserId);
  const isSwitching = useAccountStore((s) => s.isSwitching);
  const switchTo = useAccountStore((s) => s.switchTo);
  const removeAccount = useAccountStore((s) => s.removeAccount);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const canAdd = accounts.length < MAX_ACCOUNTS;

  const openAddAccount = (phone?: string) => {
    onClose();
    router.push(phone ? { pathname: "/add-account", params: { phone } } : "/add-account");
  };

  const handleSwitch = async (account: SavedAccount) => {
    if (isSwitching || account.userId === activeUserId) return;

    if (account.needsReauth) {
      openAddAccount(account.phone);
      return;
    }

    setPendingUserId(account.userId);
    const result = await switchTo(account.userId);
    setPendingUserId(null);

    if (result.ok) {
      onClose();
      return;
    }
    if (result.needsReauth) {
      Alert.alert("Login Ulang", result.error ?? "Sesi akun ini sudah berakhir.", [
        { text: "Batal", style: "cancel" },
        { text: "Masukkan Password", onPress: () => openAddAccount(account.phone) },
      ]);
      return;
    }
    Alert.alert("Gagal Pindah Akun", result.error ?? "Coba lagi sebentar.");
  };

  const confirmRemove = (account: SavedAccount) => {
    Alert.alert(
      "Hapus Akun dari Perangkat",
      `${account.name} akan dikeluarkan dari perangkat ini. Data di server tidak dihapus, dan kamu bisa menambahkannya lagi nanti dengan password.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            void removeAccount(account.userId);
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}
      >
        <Pressable
          // Cegah ketukan di dalam sheet ikut menutup lewat backdrop.
          onPress={() => undefined}
          style={{
            backgroundColor: CERDIK_COLORS.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 28,
            maxHeight: "80%",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: CERDIK_COLORS.border }} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "800", color: CERDIK_COLORS.textPrimary }}>Ganti Akun</Text>
          <Text style={{ marginTop: 2, marginBottom: 12, fontSize: 12, color: CERDIK_COLORS.textSecondary }}>
            {accounts.length} dari {MAX_ACCOUNTS} akun di perangkat ini
          </Text>

          <ScrollView>
            {accounts.map((account) => {
              const isActive = account.userId === activeUserId;
              const isPending = pendingUserId === account.userId;
              return (
                <Pressable
                  key={account.userId}
                  onPress={() => void handleSwitch(account)}
                  disabled={isSwitching}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isActive ? CERDIK_COLORS.primary : CERDIK_COLORS.border,
                    backgroundColor: isActive ? CERDIK_COLORS.surfaceSuccess : "#FFFFFF",
                    opacity: isSwitching && !isPending ? 0.6 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: `${CERDIK_COLORS.primary}22`,
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: CERDIK_COLORS.primary, fontWeight: "700", fontSize: 17 }}>
                      {account.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontWeight: "700", color: CERDIK_COLORS.textPrimary }}>
                      {account.name}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: 12, color: CERDIK_COLORS.textSecondary }}>
                      {account.phone ? displayPhone(account.phone) : account.email}
                    </Text>
                    {account.needsReauth ? (
                      <Text style={{ marginTop: 2, fontSize: 12, color: CERDIK_COLORS.danger }}>
                        Perlu login ulang
                      </Text>
                    ) : null}
                  </View>

                  {isPending ? (
                    <ActivityIndicator color={CERDIK_COLORS.primary} />
                  ) : isActive ? (
                    <Ionicons name="checkmark-circle" size={24} color={CERDIK_COLORS.primary} />
                  ) : (
                    <Pressable
                      onPress={() => confirmRemove(account)}
                      disabled={isSwitching}
                      hitSlop={10}
                      accessibilityLabel={`Hapus ${account.name} dari perangkat`}
                    >
                      <Ionicons name="trash-outline" size={20} color={CERDIK_COLORS.textSecondary} />
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {canAdd ? (
            <Pressable
              onPress={() => openAddAccount()}
              disabled={isSwitching}
              style={{
                marginTop: 4,
                height: 50,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderRadius: 16,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: CERDIK_COLORS.primary,
              }}
            >
              <Ionicons name="add" size={22} color={CERDIK_COLORS.primary} />
              <Text style={{ fontWeight: "700", color: CERDIK_COLORS.primary }}>Tambah Akun</Text>
            </Pressable>
          ) : (
            <Text style={{ marginTop: 4, textAlign: "center", fontSize: 12, color: CERDIK_COLORS.textSecondary }}>
              Maksimal {MAX_ACCOUNTS} akun. Hapus satu akun untuk menambah yang baru.
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
