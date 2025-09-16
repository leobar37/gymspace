import React, { useRef, useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import { SlideCard } from './SlideCard';
import { onboardingSlides } from '../constants/onboardingData';

interface OnboardingCarouselProps {
  currentIndex: number;
  onSlideChange: (index: number) => void;
}

const { width, height } = Dimensions.get('window');

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({ 
  currentIndex,
  onSlideChange 
}) => {
  const carouselRef = useRef<ICarouselInstance>(null);

  return (
    <View style={styles.container}>
      <Carousel
        ref={carouselRef}
        loop
        width={width}
        height={height * 0.45}
        autoPlay={true}
        autoPlayInterval={4000}
        data={onboardingSlides}
        scrollAnimationDuration={800}
        onSnapToItem={(index) => onSlideChange(index)}
        renderItem={({ item, index }) => (
          <SlideCard 
            item={item} 
            index={index}
            isActive={index === currentIndex}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});