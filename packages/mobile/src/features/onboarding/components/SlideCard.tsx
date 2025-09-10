import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { AnimatedIcon } from './AnimatedIcon';
import type { OnboardingSlide } from '../constants/onboardingData';

interface SlideCardProps {
  item: OnboardingSlide;
  index: number;
  isActive: boolean;
}

const { width } = Dimensions.get('window');

export const SlideCard: React.FC<SlideCardProps> = ({ item, index, isActive }) => {
  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInUp.delay(200).duration(600)}
        style={styles.content}
      >
        <View style={styles.iconContainer}>
          <AnimatedIcon 
            Icon={item.Icon} 
            isActive={isActive}
            size={100}
            color={item.iconColor}
          />
        </View>
        
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});