import { Ionicons } from "@expo/vector-icons";
import React, { type ReactNode, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

type Props = {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
};

const ACTION_WIDTH = 76;

export default function TransactionSwipeRow({ children, onEdit, onDelete }: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={styles.actions}>
      <Pressable
        style={[styles.btn, { backgroundColor: "#2563EB" }]}
        onPress={() => {
          swipeRef.current?.close();
          onEdit();
        }}
      >
        <Ionicons name="pencil" size={22} color="#FFFFFF" />
      </Pressable>
      <Pressable
        style={[styles.btn, { backgroundColor: "#DC2626" }]}
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
      >
        <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  return (
    <Swipeable ref={swipeRef} friction={2} overshootRight={false} renderRightActions={renderRightActions}>
      <View style={styles.rowWrap}>{children}</View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    backgroundColor: "#FFFFFF",
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
