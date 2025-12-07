import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { ChevronRightIcon } from 'lucide-react-native';

import { theme } from '../theme';

interface SwipeToConfirmButtonProps {
  label?: string;
  onConfirm: () => void;
  disabled?: boolean;
}

const KNOB_WIDTH = 70;

export function SwipeToConfirmButton({
  label = 'Swipe to Confirm',
  onConfirm,
  disabled = false,
}: SwipeToConfirmButtonProps) {
  const translateX = useSharedValue(0);
  const gestureStart = useSharedValue(0);
  const maxTranslate = useSharedValue(0);
  const hasCompleted = useSharedValue(false);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    maxTranslate.value = Math.max(width - KNOB_WIDTH, 0);
  }, [maxTranslate]);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const springConfig = {
    damping: 20,
    stiffness: 120,
    overshootClamping: true,
  } as const;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (disabled) {
        return;
      }
      gestureStart.value = translateX.value;
    })
    .onUpdate((event) => {
      if (disabled) {
        return;
      }
      const nextValue = gestureStart.value + event.translationX;
      const clamped = Math.max(0, Math.min(nextValue, maxTranslate.value));
      translateX.value = clamped;
    })
    .onEnd(() => {
      if (disabled) {
        return;
      }
      const triggerThreshold = maxTranslate.value * 0.92;

      if (translateX.value >= triggerThreshold && maxTranslate.value > 0) {
        translateX.value = withSpring(maxTranslate.value, springConfig, () => {
          if (!hasCompleted.value) {
            hasCompleted.value = true;
            runOnJS(handleConfirm)();
          }
        });
      } else {
        translateX.value = withSpring(0, springConfig);
        hasCompleted.value = false;
      }
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: maxTranslate.value === 0 ? 1 : 1 - Math.min(1, translateX.value / Math.max(maxTranslate.value, 1)),
  }));

  const progressStyle = useAnimatedStyle(() => {
    if (disabled) {
      return { width: 0 };
    }

    const progress = maxTranslate.value === 0 ? 0 : translateX.value / maxTranslate.value;
    const trailWidth = Math.min(
      translateX.value + KNOB_WIDTH,
      maxTranslate.value + KNOB_WIDTH
    );

    return {
      width: trailWidth,
      backgroundColor: interpolateColor(
        progress,
        [0, 1],
        [theme.colors.emerald[100], theme.colors.emerald[500]]
      ),
    };
  });

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={panGesture}>
        <View
          style={[styles.container, disabled && styles.containerDisabled]}
          onLayout={handleLayout}
        >
          <ReAnimated.View style={[styles.progressFill, progressStyle]} />
          <ReAnimated.View style={[styles.labelContainer, labelStyle]}>
            <Text style={[styles.label, disabled && styles.labelDisabled]}>
              {label}
            </Text>
          </ReAnimated.View>

          <ReAnimated.View
            style={[styles.knob, knobStyle, disabled && styles.knobDisabled]}
          >
            <ChevronRightIcon color="#ffffff" size={24} strokeWidth={2.5} />
          </ReAnimated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    width: '100%',
    height: 60,
    borderRadius: 32,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  containerDisabled: {
    backgroundColor: '#e5e7eb',
    borderColor: '#d4d4d8',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 32,
  },
  labelContainer: {
    position: 'absolute',
    left: KNOB_WIDTH,
    right: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.zinc[600],
  },
  labelDisabled: {
    color: theme.colors.zinc[400],
  },
  knob: {
    width: KNOB_WIDTH,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.emerald[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  knobDisabled: {
    backgroundColor: theme.colors.zinc[400],
  },
});
