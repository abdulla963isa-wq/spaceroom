import React, { useRef, useState, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { COLORS } from "../constants/colors";

const ITEM_HEIGHT = 52;
const SIDE = 2; // items visible above and below the selection

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// ─── Individual wheel column ───────────────────────────────────────────────

interface WheelProps {
  items: string[];
  initIndex: number;
  onSettle: (i: number) => void;
  width: number;
}

function WheelColumn({ items, initIndex, onSettle, width }: WheelProps) {
  const ref = useRef<ScrollView>(null);
  const [active, setActive] = useState(initIndex);

  // Scroll to initial position after layout
  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: initIndex * ITEM_HEIGHT, animated: false });
      setActive(initIndex);
    }, 80);
    return () => clearTimeout(t);
  }, []); // only on mount (parent uses key prop to remount when needed)

  const settle = (y: number) => {
    const i = Math.max(0, Math.min(Math.round(y / ITEM_HEIGHT), items.length - 1));
    setActive(i);
    onSettle(i);
    ref.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: false });
  };

  return (
    <View style={{ width, height: ITEM_HEIGHT * (SIDE * 2 + 1), overflow: "hidden" }}>
      {/* Selection highlight band */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bandWrapper]}>
        <View style={styles.band} />
      </View>

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
          setActive(Math.max(0, Math.min(i, items.length - 1)));
        }}
        onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => settle(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * SIDE }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(active - i);
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={1}
              style={styles.cell}
              onPress={() => {
                ref.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
                setActive(i);
                onSettle(i);
              }}
            >
              <Text
                style={[
                  styles.cellText,
                  active === i && styles.cellTextActive,
                  dist === 1 && styles.cellTextNear,
                  dist >= 2 && styles.cellTextFar,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Date Picker Modal ────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  value: string; // "DD-MM-YYYY" or ""
  onConfirm: (date: string) => void;
  onClose: () => void;
}

export default function DatePickerModal({ visible, value, onConfirm, onClose }: Props) {
  const currentYear = new Date().getFullYear();

  const initial = useMemo(() => {
    if (value && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
      const [d, m, y] = value.split("-").map(Number);
      return { day: d, month: m, year: y };
    }
    return { day: 1, month: 1, year: currentYear - 25 };
  }, [value]);

  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setDay(initial.day);
      setMonth(initial.month);
      setYear(initial.year);
    }
  }, [visible]);

  const years = useMemo(
    () => Array.from({ length: currentYear - 1923 }, (_, i) => String(currentYear - i)),
    [currentYear]
  );

  const maxDay = daysInMonth(month, year);
  const effectiveDay = Math.min(day, maxDay);
  const days = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => pad(i + 1)),
    [maxDay]
  );

  const preview = `${MONTH_NAMES[month - 1]} ${effectiveDay}, ${year}`;

  const handleDone = () => {
    onConfirm(`${pad(effectiveDay)}-${pad(month)}-${year}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>Date of Birth</Text>
              <Text style={styles.preview}>{preview}</Text>
            </View>
            <TouchableOpacity onPress={handleDone} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Column labels */}
          <View style={styles.labels}>
            <Text style={[styles.columnLabel, { width: 70 }]}>Day</Text>
            <Text style={[styles.columnLabel, { width: 130 }]}>Month</Text>
            <Text style={[styles.columnLabel, { width: 80 }]}>Year</Text>
          </View>

          {/* Wheels */}
          <View style={styles.wheelsRow}>
            {/* Day — remounts when maxDay changes so it resets to effectiveDay */}
            <WheelColumn
              key={`day-${maxDay}`}
              items={days}
              initIndex={effectiveDay - 1}
              onSettle={(i) => setDay(i + 1)}
              width={70}
            />
            {/* Month — remounts when modal reopens with different initial month */}
            <WheelColumn
              key={`month-open${visible}-${initial.month}`}
              items={MONTH_NAMES}
              initIndex={month - 1}
              onSettle={(i) => setMonth(i + 1)}
              width={130}
            />
            {/* Year — remounts when modal reopens with different initial year */}
            <WheelColumn
              key={`year-open${visible}-${initial.year}`}
              items={years}
              initIndex={years.indexOf(String(year))}
              onSettle={(i) => setYear(Number(years[i]))}
              width={80}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCenter: { alignItems: "center", flex: 1 },
  title: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 15 },
  preview: { color: COLORS.primary, fontSize: 13, marginTop: 2 },
  cancelText: { color: COLORS.textSecondary, fontSize: 15 },
  doneText: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },

  labels: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  columnLabel: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  wheelsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Wheel internals
  bandWrapper: { justifyContent: "center" },
  band: {
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.primary + "40",
    backgroundColor: COLORS.primary + "0C",
  },
  cell: { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" },
  cellText: { fontSize: 15, color: COLORS.textMuted },
  cellTextActive: { fontSize: 17, color: COLORS.primary, fontWeight: "700" },
  cellTextNear: { color: COLORS.textSecondary, fontSize: 15 },
  cellTextFar: { opacity: 0.35 },
});
