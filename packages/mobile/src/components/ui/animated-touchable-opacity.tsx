import React, { useMemo } from 'react';
import {
  Pressable,
  PressableProps,
  ViewStyle,
  GestureResponderEvent,
  View
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable as any) as any;

export interface AnimatedTouchableOpacityProps extends Omit<PressableProps, 'style'> {
  children?: React.ReactNode;
  activeOpacity?: number;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

/**
 * AnimatedTouchableOpacity Component
 *
 * A drop-in replacement for TouchableOpacity that's compatible with:
 * - Expo SDK 54
 * - React Native 0.81.4
 * - React Native Reanimated v4
 * - New Architecture enabled
 *
 * This component uses Pressable (the modern replacement for TouchableOpacity)
 * with animation support to resolve compatibility issues with the new architecture.
 *
 * Key differences from TouchableOpacity:
 * - Uses Pressable under the hood (recommended by React Native)
 * - Fully compatible with Reanimated v4
 * - Supports all animation styles
 * - Better performance with New Architecture
 *
 * Usage:
 * ```tsx
 * import { AnimatedTouchableOpacity } from '@/components/ui/animated-touchable-opacity';
 *
 * <AnimatedTouchableOpacity
 *   onPress={handlePress}
 *   activeOpacity={0.7}
 *   style={styles.button}
 * >
 *   <Text>Button Text</Text>
 * </AnimatedTouchableOpacity>
 * ```
 */
export const AnimatedTouchableOpacity = React.forwardRef<
  View,
  AnimatedTouchableOpacityProps
>(({
  children,
  activeOpacity = 0.2,
  style,
  onPressIn,
  onPressOut,
  disabled = false,
  ...props
}, ref) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        pressed.value,
        [0, 1],
        [1, activeOpacity]
      ),
    };
  });

  const handlePressIn = (event: GestureResponderEvent) => {
    pressed.value = withSpring(1, {
      damping: 100,
      stiffness: 400,
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    pressed.value = withSpring(0, {
      damping: 100,
      stiffness: 400,
    });
    onPressOut?.(event);
  };

  const combinedStyle = useMemo(() => {
    if (Array.isArray(style)) {
      return [...style];
    }
    return style ? [style] : [];
  }, [style]);

  return (
    <AnimatedPressable
      ref={ref}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[combinedStyle, animatedStyle]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
});

AnimatedTouchableOpacity.displayName = 'AnimatedTouchableOpacity';

export default AnimatedTouchableOpacity;