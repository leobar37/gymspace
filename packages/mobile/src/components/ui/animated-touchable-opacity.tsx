import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type AnimatedTouchableOpacityProps = TouchableOpacityProps & {
  children: React.ReactNode;
};

export default AnimatedTouchableOpacity;