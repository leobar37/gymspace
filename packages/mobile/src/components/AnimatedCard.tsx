import React from "react";
import { Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface AnimatedCardProps {
  title: string;
  description: string;
  onPress?: () => void;
}

export function AnimatedCard({ title, description, onPress }: AnimatedCardProps) {
  const pressed = useSharedValue(false);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
      scale.value = withSpring(0.95);
    })
    .onFinalize(() => {
      pressed.value = false;
      scale.value = withSpring(1);
      if (onPress) onPress();
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      rotation.value = interpolate(
        event.translationX,
        [-200, 0, 200],
        [-10, 0, 10],
        Extrapolate.CLAMP
      );
    })
    .onEnd(() => {
      rotation.value = withSpring(0);
    });

  const composed = Gesture.Simultaneous(tap, pan);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotateZ: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={animatedStyle}
        className="bg-white rounded-xl p-6 shadow-lg mx-4 my-2"
      >
        <Text className="text-xl font-bold text-gray-800 mb-2">{title}</Text>
        <Text className="text-gray-600">{description}</Text>
      </Animated.View>
    </GestureDetector>
  );
}