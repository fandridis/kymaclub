import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StatusBar, ColorValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const onboardingData = [
  {
    title: "Welcome to Adventure",
    description: "Discover amazing experiences tailored just for you",
    gradientColors: ['#667eea', '#764ba2', '#f093fb']
  },
  {
    title: "Connect & Share",
    description: "Build meaningful connections with people who share your interests",
    gradientColors: ['#ffecd2', '#fcb69f', '#ff9a9e']
  },
  {
    title: "Track Your Journey",
    description: "Monitor your progress and celebrate every milestone along the way",
    gradientColors: ['#a8edea', '#fed6e3', '#d299c2']
  },
  {
    title: "Ready to Begin?",
    description: "Your amazing journey starts with a single tap",
    gradientColors: ['#ff9a9e', '#fecfef', '#fecfef']
  }
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const translateX = useSharedValue(0);

  const handleNext = () => {
    if (currentStep < onboardingData.length - 1) {
      translateX.value = withTiming(translateX.value - SCREEN_WIDTH, {
        duration: 600,
      }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      translateX.value = withTiming(translateX.value + SCREEN_WIDTH, {
        duration: 600,
      }, () => {
        runOnJS(setCurrentStep)(currentStep - 1);
      });
    }
  };

  const handleStart = () => {
    console.log('Starting the app!');
    // Add your navigation logic here
    // For example: navigation.navigate('MainApp');
  };

  // Background animation style with parallax effect
  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    const totalTranslateX = translateX.value;
    return {
      transform: [
        {
          translateX: interpolate(
            totalTranslateX,
            [-SCREEN_WIDTH, 0],
            [SCREEN_WIDTH * 0.3, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  // Title animation with stronger parallax
  const titleAnimatedStyle = useAnimatedStyle(() => {
    const totalTranslateX = translateX.value;
    return {
      transform: [
        {
          translateX: interpolate(
            totalTranslateX,
            [-SCREEN_WIDTH, 0],
            [SCREEN_WIDTH * 0.8, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        totalTranslateX,
        [-SCREEN_WIDTH * 0.5, 0],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  // Description animation with medium parallax
  const descriptionAnimatedStyle = useAnimatedStyle(() => {
    const totalTranslateX = translateX.value;
    return {
      transform: [
        {
          translateX: interpolate(
            totalTranslateX,
            [-SCREEN_WIDTH, 0],
            [SCREEN_WIDTH * 0.6, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        totalTranslateX,
        [-SCREEN_WIDTH * 0.3, 0],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  // Buttons animation with subtle parallax
  const buttonsAnimatedStyle = useAnimatedStyle(() => {
    const totalTranslateX = translateX.value;
    return {
      transform: [
        {
          translateX: interpolate(
            totalTranslateX,
            [-SCREEN_WIDTH, 0],
            [SCREEN_WIDTH * 0.4, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        totalTranslateX,
        [-SCREEN_WIDTH * 0.2, 0],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        {/* Animated Background with Gradient */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: SCREEN_WIDTH * 1.5,
              height: SCREEN_HEIGHT,
              left: -SCREEN_WIDTH * 0.25,
            },
            backgroundAnimatedStyle,
          ]}
        >
          <LinearGradient
            colors={onboardingData[currentStep].gradientColors as [ColorValue, ColorValue, ColorValue]}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Content Container */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
          }}
        >
          {/* Progress Indicators */}
          <View
            style={{
              position: 'absolute',
              top: 100,
              flexDirection: 'row',
              gap: 8,
            }}
          >
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentStep ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>

          {/* Title with Parallax Animation */}
          <Animated.View style={[titleAnimatedStyle, { marginBottom: 24 }]}>
            <Text
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: '#fff',
                textAlign: 'center',
                textShadowColor: 'rgba(0,0,0,0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              {onboardingData[currentStep].title}
            </Text>
          </Animated.View>

          {/* Description with Parallax Animation */}
          <Animated.View style={[descriptionAnimatedStyle, { marginBottom: 60 }]}>
            <Text
              style={{
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                lineHeight: 26,
                opacity: 0.9,
                textShadowColor: 'rgba(0,0,0,0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {onboardingData[currentStep].description}
            </Text>
          </Animated.View>

          {/* Navigation Buttons with Parallax Animation */}
          <Animated.View
            style={[
              buttonsAnimatedStyle,
              {
                flexDirection: 'row',
                gap: 16,
                width: '100%',
                justifyContent: 'center',
              },
            ]}
          >
            {currentStep < onboardingData.length - 1 ? (
              <>
                {/* Previous Button */}
                {currentStep > 0 && (
                  <TouchableOpacity
                    onPress={handlePrevious}
                    style={{
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 25,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <Text
                      style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Next Button */}
                <TouchableOpacity
                  onPress={handleNext}
                  style={{
                    paddingHorizontal: 32,
                    paddingVertical: 12,
                    borderRadius: 25,
                    backgroundColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  <Text
                    style={{
                      color: onboardingData[currentStep].gradientColors[1],
                      fontSize: 16,
                      fontWeight: '700',
                    }}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Start Now Button - Final Step */
              <TouchableOpacity
                onPress={handleStart}
                style={{
                  paddingHorizontal: 48,
                  paddingVertical: 16,
                  borderRadius: 30,
                  backgroundColor: '#fff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 12,
                }}
              >
                <Text
                  style={{
                    color: onboardingData[currentStep].gradientColors[1],
                    fontSize: 20,
                    fontWeight: '800',
                  }}
                >
                  Start Now
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}