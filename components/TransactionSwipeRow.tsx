import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode, useCallback, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { CERDIK_COLORS } from "@/constants/colors";

type Props = {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
};

const ACTION_WIDTH = 76;

function TransactionSwipeRow({ children, onEdit, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = useCallback(
    () => (
      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, { backgroundColor: CERDIK_COLORS.primary }]}
          onPress={() => {
            swipeRef.current?.close();
            onEdit();
          }}
        >
          <Ionicons name="pencil" size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={[styles.btn, { backgroundColor: CERDIK_COLORS.danger }]}
          onPress={() => {
            swipeRef.current?.close();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    ),
    [onEdit, onDelete],
  );

  return (
    <Swipeable ref={swipeRef} friction={2} overshootRight={false} renderRightActions={renderRightActions}>
      <View style={styles.rowWrap}>{children}</View>
    </Swipeable>
  );
}

export default React.memo(TransactionSwipeRow);

const styles = StyleSheet.create({
  rowWrap: {
    backgroundColor: CERDIK_COLORS.card,
  },
  actions: {
    flexDirection: "row",
    width: ACTION_WIDTH * 2,
  },
  btn: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
});
