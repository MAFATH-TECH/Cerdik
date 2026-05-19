import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Animated, LayoutChangeEvent, PanResponder, View } from "react-native";

const FAB_SIZE = 56;
const STORAGE_KEY = "cerdik:edukasi-fab-position";
const EDGE_PADDING = 12;
const BOTTOM_CLEARANCE = 88;
const TAP_SLOP = 10;

type FabPosition = { x: number; y: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function DraggableEdukasiFab() {
  const containerRef = useRef({ width: 0, height: 0 });
  const position = useRef(new Animated.ValueXY()).current;
  const dragOrigin = useRef<FabPosition>({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const readyRef = useRef(false);

  const getDefaultPosition = useCallback((width: number, height: number): FabPosition => {
    return {
      x: Math.max(EDGE_PADDING, width - FAB_SIZE - 20),
      y: Math.max(EDGE_PADDING, height - FAB_SIZE - BOTTOM_CLEARANCE),
    };
  }, []);

  const clampPosition = useCallback((x: number, y: number, width: number, height: number): FabPosition => {
    return {
      x: clamp(x, EDGE_PADDING, Math.max(EDGE_PADDING, width - FAB_SIZE - EDGE_PADDING)),
      y: clamp(y, EDGE_PADDING, Math.max(EDGE_PADDING, height - FAB_SIZE - EDGE_PADDING)),
    };
  }, []);

  const applyPosition = useCallback(
    (next: FabPosition, width: number, height: number, animated = false) => {
      const clamped = clampPosition(next.x, next.y, width, height);
      dragOrigin.current = clamped;
      if (animated) {
        Animated.spring(position, {
          toValue: clamped,
          useNativeDriver: false,
          friction: 7,
          tension: 80,
        }).start();
      } else {
        position.setValue(clamped);
      }
    },
    [clampPosition, position],
  );

  const persistPosition = useCallback(async (next: FabPosition) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const loadPosition = useCallback(
    async (width: number, height: number) => {
      const fallback = getDefaultPosition(width, height);
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as FabPosition;
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            applyPosition(parsed, width, height);
            return;
          }
        }
      } catch {
        // ignore
      }
      applyPosition(fallback, width, height);
    },
    [applyPosition, getDefaultPosition],
  );

  const onContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width <= 0 || height <= 0) return;

      containerRef.current = { width, height };

      if (!readyRef.current) {
        readyRef.current = true;
        loadPosition(width, height).catch(() => {
          applyPosition(getDefaultPosition(width, height), width, height);
        });
        return;
      }

      applyPosition(dragOrigin.current, width, height, true);
    },
    [applyPosition, getDefaultPosition, loadPosition],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => {
          movedRef.current = false;
          position.stopAnimation((value) => {
            dragOrigin.current = { x: value.x, y: value.y };
          });
        },
        onPanResponderMove: (_, gesture) => {
          if (Math.abs(gesture.dx) > TAP_SLOP || Math.abs(gesture.dy) > TAP_SLOP) {
            movedRef.current = true;
          }
          position.setValue({
            x: dragOrigin.current.x + gesture.dx,
            y: dragOrigin.current.y + gesture.dy,
          });
        },
        onPanResponderRelease: (_, gesture) => {
          const { width, height } = containerRef.current;
          if (width <= 0 || height <= 0) return;

          const totalMove = Math.hypot(gesture.dx, gesture.dy);
          const next = clampPosition(
            dragOrigin.current.x + gesture.dx,
            dragOrigin.current.y + gesture.dy,
            width,
            height,
          );

          applyPosition(next, width, height, true);
          persistPosition(next).catch(() => undefined);

          if (!movedRef.current && totalMove < TAP_SLOP) {
            router.push("/edukasi");
          }
        },
        onPanResponderTerminate: (_, gesture) => {
          const { width, height } = containerRef.current;
          if (width <= 0 || height <= 0) return;
          const next = clampPosition(
            dragOrigin.current.x + gesture.dx,
            dragOrigin.current.y + gesture.dy,
            width,
            height,
          );
          applyPosition(next, width, height, true);
          persistPosition(next).catch(() => undefined);
        },
      }),
    [applyPosition, clampPosition, persistPosition, position],
  );

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 999 }}
      onLayout={onContainerLayout}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            position: "absolute",
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            backgroundColor: "#1A5C2E",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 8,
          },
          {
            transform: position.getTranslateTransform(),
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Buka Edukasi, tekan untuk buka, geser untuk pindah posisi"
      >
        <Ionicons name="book-outline" size={26} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}
