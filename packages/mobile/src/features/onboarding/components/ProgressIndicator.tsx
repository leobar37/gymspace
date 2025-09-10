import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ProgressDotProps {
  index: number;
  currentIndex: number;
}

const ProgressDot: React.FC<ProgressDotProps> = ({ index, currentIndex }) => {
  const width = useSharedValue(8);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const isActive = index === currentIndex;
    width.value = withSpring(isActive ? 24 : 8, {
      damping: 15,
      stiffness: 200,
    });
    opacity.value = withTiming(isActive ? 1 : 0.3, {
      duration: 300,
    });
  }, [currentIndex, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
    marginHorizontal: 4,
  }));

  return <Animated.View style={animatedStyle} />;
};

interface ProgressIndicatorProps {
  total: number;
  currentIndex: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  total, 
  currentIndex 
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <ProgressDot 
          key={index}
          index={index} 
          currentIndex={currentIndex}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});