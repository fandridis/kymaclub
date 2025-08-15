import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StatusBar, TextInput, ScrollView, SafeAreaView } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingData {
  userName?: string;
  goal?: string;
  activities?: string[];
  creditPackage?: number;
}

const GOALS = [
  { id: 'stronger', label: 'Get Stronger', emoji: '💪' },
  { id: 'relax', label: 'Relax', emoji: '🧘‍♀️' },
  { id: 'activities', label: 'Try New Activities', emoji: '🌟' }
];

const ACTIVITIES = [
  { id: 'yoga', label: 'Yoga', emoji: '🧘‍♀️' },
  { id: 'pilates', label: 'Pilates', emoji: '🤸‍♀️' },
  { id: 'strength', label: 'Strength', emoji: '💪' },
  { id: 'hiit', label: 'HIIT', emoji: '🔥' },
  { id: 'dance', label: 'Dance', emoji: '💃' },
  { id: 'boxing', label: 'Boxing', emoji: '🥊' },
  { id: 'mobility', label: 'Mobility', emoji: '🤲' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴‍♀️' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊‍♀️' },
  { id: 'barre', label: 'Barre', emoji: '🩰' },
  { id: 'crosstraining', label: 'Cross-training', emoji: '🏋️‍♀️' }
];

const CREDIT_PACKAGES = [
  { credits: 10, price: '€20', popular: false },
  { credits: 25, price: '€45', popular: false },
  { credits: 50, price: '€85', popular: true },
  { credits: 75, price: '€120', popular: false },
  { credits: 100, price: '€150', popular: false, fullWidth: true }
];

const stepConfig = [
  {
    title: "Welcome to KymaClub! 👋",
    description: "Let's personalize your wellness journey"
  },
  {
    title: "What's your goal?",
    description: "Choose what motivates you most"
  },
  {
    title: "What are you into?",
    description: "Select all that spark your curiosity"
  },
  {
    title: "Choose your credits",
    description: "Pick a package that fits your lifestyle"
  }
];

const THEME = {
  background: '#f8fafc',
  primary: '#3b82f6',
  primaryLight: '#dbeafe',
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  white: '#ffffff',
  border: '#e2e8f0',
  success: '#10b981',
  successLight: '#d1fae5',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const handleNext = () => {
    if (currentStep < stepConfig.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < stepConfig.length - 1) {
      handleNext();
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    console.log('user onboarded with data:', onboardingData);
    // Add your navigation logic here to mark onboarding as complete
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderNameStep();
      case 1:
        return renderGoalStep();
      case 2:
        return renderActivitiesStep();
      case 3:
        return renderCreditsStep();
      default:
        return null;
    }
  };

  const renderNameStep = () => (
    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
      <Text style={{
        fontSize: 16,
        color: THEME.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 24
      }}>
        How should we call you?
      </Text>
      <TextInput
        style={{
          backgroundColor: THEME.white,
          padding: 20,
          borderRadius: 16,
          fontSize: 18,
          width: '100%',
          maxWidth: 320,
          textAlign: 'center',
          fontWeight: '600',
          borderWidth: 2,
          borderColor: onboardingData.userName ? THEME.primary : THEME.border,
          shadowColor: THEME.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3
        }}
        placeholder="Enter your name"
        placeholderTextColor={THEME.textLight}
        value={onboardingData.userName || ''}
        onChangeText={(text) => setOnboardingData(prev => ({ ...prev, userName: text }))}
      />
    </View>
  );

  const renderGoalStep = () => (
    <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
      {GOALS.map((goal) => {
        const isSelected = onboardingData.goal === goal.id;
        return (
          <TouchableOpacity
            key={goal.id}
            onPress={() => {
              setOnboardingData(prev => ({ ...prev, goal: goal.id }));
            }}
            style={{
              marginBottom: 16,
              width: '100%',
              maxWidth: 320,
            }}
          >
            <View style={{
              backgroundColor: THEME.white,
              padding: 24,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: isSelected ? THEME.primary : THEME.border,
              shadowColor: THEME.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isSelected ? 0.15 : 0.05,
              shadowRadius: 12,
              elevation: isSelected ? 6 : 2,
            }}>
              <Text style={{ fontSize: 28, marginRight: 20 }}>{goal.emoji}</Text>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: isSelected ? THEME.primary : THEME.text,
                flex: 1
              }}>
                {goal.label}
              </Text>
              {isSelected && (
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: THEME.success,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderActivitiesStep = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      style={{ maxHeight: SCREEN_HEIGHT * 0.5 }}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
      }}>
        {ACTIVITIES.map((activity) => {
          const isSelected = onboardingData.activities?.includes(activity.id) || false;
          return (
            <TouchableOpacity
              key={activity.id}
              onPress={() => {
                setOnboardingData(prev => ({
                  ...prev,
                  activities: isSelected
                    ? prev.activities?.filter(id => id !== activity.id) || []
                    : [...(prev.activities || []), activity.id]
                }));
              }}
              style={{
                width: '48%',
                marginBottom: 16,
              }}
            >
              <View style={{
                backgroundColor: THEME.white,
                padding: 20,
                borderRadius: 16,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: isSelected ? THEME.primary : THEME.border,
                shadowColor: THEME.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.1 : 0.05,
                shadowRadius: 8,
                elevation: isSelected ? 4 : 2,
                minHeight: 90,
                justifyContent: 'center'
              }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>{activity.emoji}</Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isSelected ? THEME.primary : THEME.text,
                  textAlign: 'center'
                }}>
                  {activity.label}
                </Text>
                {isSelected && (
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: THEME.success,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderCreditsStep = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false} 
      style={{ maxHeight: SCREEN_HEIGHT * 0.6 }}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
        {CREDIT_PACKAGES.map((pkg) => {
          const isSelected = onboardingData.creditPackage === pkg.credits;
          return (
            <TouchableOpacity
              key={pkg.credits}
              onPress={() => {
                setOnboardingData(prev => ({ ...prev, creditPackage: pkg.credits }));
              }}
              style={{
                marginBottom: 16,
                width: '100%',
                maxWidth: 320,
              }}
            >
              <View style={{
                backgroundColor: THEME.white,
                padding: 24,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: isSelected ? THEME.primary : pkg.popular ? THEME.primary : THEME.border,
                shadowColor: THEME.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isSelected ? 0.15 : pkg.popular ? 0.1 : 0.05,
                shadowRadius: 12,
                elevation: isSelected ? 6 : pkg.popular ? 4 : 2,
                position: 'relative'
              }}>
                {pkg.popular && (
                  <View style={{
                    position: 'absolute',
                    top: -12,
                    left: 20,
                    backgroundColor: THEME.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>POPULAR</Text>
                  </View>
                )}
                
                {/* Credits Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: isSelected ? THEME.primary : THEME.text,
                    marginBottom: 4
                  }}>
                    {pkg.credits} Credits
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: isSelected ? THEME.success : THEME.textSecondary
                  }}>
                    {pkg.price}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {isSelected && (
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: THEME.success,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24
      }}>
        {/* Progress Indicators */}
        <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
          {stepConfig.map((_, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: index <= currentStep ? THEME.primary : THEME.border,
              }}
            />
          ))}
        </View>
        
        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginLeft: 16
          }}
        >
          <Text style={{ 
            color: THEME.textSecondary, 
            fontSize: 16, 
            fontWeight: '600' 
          }}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 0 }}>
          {/* Title and Description */}
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '800',
              color: THEME.text,
              textAlign: 'center',
              marginBottom: 12,
              lineHeight: 34
            }}>
              {stepConfig[currentStep].title}
            </Text>
            <Text style={{
              fontSize: 16,
              color: THEME.textSecondary,
              textAlign: 'center',
              lineHeight: 24
            }}>
              {stepConfig[currentStep].description}
            </Text>
          </View>

          {/* Step Content */}
          <View style={{ flex: 1 }}>
            {renderStepContent()}
          </View>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={{
        paddingHorizontal: 24,
        paddingBottom: 24,
        paddingTop: 16,
        backgroundColor: THEME.background,
        borderTopWidth: 1,
        borderTopColor: THEME.border
      }}>
        <View style={{
          flexDirection: 'row',
          gap: 12,
          alignItems: 'center'
        }}>
          {/* Previous Button */}
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handlePrevious}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 16,
                borderRadius: 12,
                backgroundColor: THEME.white,
                borderWidth: 1,
                borderColor: THEME.border,
                flex: 1
              }}
            >
              <Text style={{
                color: THEME.text,
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Previous
              </Text>
            </TouchableOpacity>
          )}

          {/* Next/Complete Button */}
          <TouchableOpacity
            onPress={currentStep < stepConfig.length - 1 ? handleNext : handleFinish}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderRadius: 12,
              backgroundColor: THEME.primary,
              flex: currentStep === 0 ? 1 : 2,
              shadowColor: THEME.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6
            }}
          >
            <Text style={{
              color: THEME.white,
              fontSize: 16,
              fontWeight: '700',
              textAlign: 'center'
            }}>
              {currentStep < stepConfig.length - 1 ? 'Next' : 'Get Started!'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}