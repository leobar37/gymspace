import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';

interface AnimatedIconProps {
  Icon: LucideIcon;
  isActive: boolean;
  color?: string;
  size?: number;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({ 
  Icon, 
  isActive, 
  color = 'white',
  size = 80 
}) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Initial animation
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
  }, []);

  useEffect(() => {
    if (isActive) {
      // Active state animations
      scale.value = withSpring(1.1);
      rotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 150 }),
          withTiming(-5, { duration: 150 }),
          withTiming(0, { duration: 150 })
        ),
        2,
        false
      );
    } else {
      // Inactive state
      scale.value = withSpring(1);
      rotation.value = withTiming(0);
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      rotation.value,
      [-5, 0, 5],
      [-5, 0, 5]
    );

    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Icon size={size} color={color} strokeWidth={1.5} />
    </Animated.View>
  );
};