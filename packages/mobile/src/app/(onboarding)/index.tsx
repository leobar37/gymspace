import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInUp, 
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Feature components
import { AnimatedLogo } from '@/features/onboarding/components/AnimatedLogo';
import { OnboardingCarousel } from '@/features/onboarding/components/OnboardingCarousel';
import { ProgressIndicator } from '@/features/onboarding/components/ProgressIndicator';
import { onboardingSlides } from '@/features/onboarding/constants/onboardingData';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLoginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/login');
  };

  const handleRegisterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/owner/step-1-personal');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <AnimatedLogo />
        </Animated.View>

        {/* Carousel */}
        <View style={styles.carouselContainer}>
          <OnboardingCarousel 
            currentIndex={currentIndex}
            onSlideChange={setCurrentIndex}
          />
        </View>

        {/* Progress Indicator */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <ProgressIndicator 
            total={onboardingSlides.length}
            currentIndex={currentIndex}
          />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          entering={FadeInUp.delay(600).duration(600)}
          style={styles.buttonsContainer}
        >
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleLoginPress}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleRegisterPress}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeArea: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
});