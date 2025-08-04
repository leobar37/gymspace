import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { Toast, ToastDescription, ToastTitle, useToast } from '@/components/ui/toast';
import { VStack } from '@/components/ui/vstack';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { Building2, ChevronRight, Clock, DollarSign, Globe } from 'lucide-react-native';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useOnboardingController } from '../controllers/onboarding.controller';
import {
  currentOnboardingStepAtom,
  registrationFormAtom,
  registrationFormValidationAtom
} from '../stores/onboarding.store';
const countries = [
  { label: 'Peru', value: 'PE' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'Colombia', value: 'CO' },
];

const currencies = [
  { label: 'Peruvian Sol (PEN)', value: 'PEN' },
  { label: 'US Dollar (USD)', value: 'USD' },
  { label: 'Colombian Peso (COP)', value: 'COP' },
];

const timezones = [
  { label: 'Lima', value: 'America/Lima' },
  { label: 'Quito', value: 'America/Guayaquil' },
  { label: 'Bogotá', value: 'America/Bogota' },
];

export const OnboardingStart = () => {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useAtom(registrationFormAtom);
  const [validation] = useAtom(registrationFormValidationAtom);
  const [currentStep, setCurrentStep] = useAtom(currentOnboardingStepAtom);
  const { startOnboarding, isStarting, startError } = useOnboardingController();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationStep, setShowVerificationStep] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleNext = () => {
    if (!validation.isValid) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={id} variant="outline">
            <ToastTitle>Validation Error</ToastTitle>
            <ToastDescription>Please fill in all required fields correctly</ToastDescription>
          </Toast>
        ),
      });
      return;
    }

    // Move to verification step
    setShowVerificationStep(true);
    setCurrentStep(2);
  };

  const handleStartOnboarding = () => {
    if (!form.verificationCode || form.verificationCode.length !== 6) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Toast nativeID={id} >
            <ToastTitle>Invalid Code</ToastTitle>
            <ToastDescription>Please enter the 6-digit verification code</ToastDescription>
          </Toast>
        ),
      });
      return;
    }

    // TODO: Set subscription plan ID based on selection
    const onboardingData = {
      ...form,
      subscriptionPlanId: 'default-plan-id', // This should come from plan selection
    };

    startOnboarding(onboardingData);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-gray-50">
        <Box className="px-4 py-6">
          {/* Progress Bar */}
          <Box className="mb-6">
            <Progress value={showVerificationStep ? 66 : 33} className="h-2">
              <ProgressFilledTrack className="bg-primary-500" />
            </Progress>
            <Text className="text-sm text-gray-600 mt-2">
              Step {showVerificationStep ? 2 : 1} of 3
            </Text>
          </Box>

          {/* Header */}
          <VStack className="mb-8 items-center">
            <Heading className="text-3xl font-bold text-gray-900 mb-2">
              {showVerificationStep ? 'Verify Your Email' : 'Welcome to GymSpace'}
            </Heading>
            <Text className="text-gray-600 text-center">
              {showVerificationStep 
                ? 'Enter the verification code sent to your email'
                : 'Let\'s get your gym set up in just a few minutes'
              }
            </Text>
          </VStack>

          {!showVerificationStep ? (
            <VStack className="gap-6">
              {/* Owner Information */}
              <Card className="p-5 rounded-lg">
                <Heading className="text-xl mb-4">Owner Information</Heading>
                <VStack className="gap-4">
                    <FormControl isInvalid={!!validation.errors.name}>
                      <FormControlLabel>
                        <FormControlLabelText>Full Name</FormControlLabelText>
                      </FormControlLabel>
                      <FormInput
                        value={form.name}
                        onChangeText={(value) => updateField('name', value)}
                        placeholder="John Doe"
                      />
                      {validation.errors.name && (
                        <FormControlError>
                          <FormControlErrorText>{validation.errors.name}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!validation.errors.email}>
                      <FormControlLabel>
                        <FormControlLabelText>Email Address</FormControlLabelText>
                      </FormControlLabel>
                      <FormInput
                        value={form.email}
                        onChangeText={(value) => updateField('email', value)}
                        placeholder="john@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {validation.errors.email && (
                        <FormControlError>
                          <FormControlErrorText>{validation.errors.email}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!validation.errors.phone}>
                      <FormControlLabel>
                        <FormControlLabelText>Phone Number</FormControlLabelText>
                      </FormControlLabel>
                      <FormInput
                        value={form.phone}
                        onChangeText={(value) => updateField('phone', value)}
                        placeholder="+1 (555) 123-4567"
                        keyboardType="phone-pad"
                      />
                      {validation.errors.phone && (
                        <FormControlError>
                          <FormControlErrorText>{validation.errors.phone}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!validation.errors.password}>
                      <FormControlLabel>
                        <FormControlLabelText>Password</FormControlLabelText>
                      </FormControlLabel>
                      <FormInput
                        value={form.password}
                        onChangeText={(value) => updateField('password', value)}
                        placeholder="Create a secure password"
                        secureTextEntry={!showPassword}
                        showPasswordToggle
                        onTogglePassword={() => setShowPassword(!showPassword)}
                      />
                      {validation.errors.password && (
                        <FormControlError>
                          <FormControlErrorText>{validation.errors.password}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl isInvalid={!!validation.errors.confirmPassword}>
                      <FormControlLabel>
                        <FormControlLabelText>Confirm Password</FormControlLabelText>
                      </FormControlLabel>
                      <FormInput
                        value={form.confirmPassword}
                        onChangeText={(value) => updateField('confirmPassword', value)}
                        placeholder="Confirm your password"
                        secureTextEntry={!showConfirmPassword}
                        showPasswordToggle
                        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                      {validation.errors.confirmPassword && (
                        <FormControlError>
                          <FormControlErrorText>{validation.errors.confirmPassword}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>
                  </VStack>
                </Card>

                {/* Organization Information */}
                <Card className="p-5 rounded-lg">
                  <Heading className="text-xl mb-4">Organization Details</Heading>
                  <VStack className="gap-4">
                    <FormControl isInvalid={!!validation.errors.organizationName}>
                      <FormControlLabel>
                        <FormControlLabelText>Organization Name</FormControlLabelText>
                      </FormControlLabel>
                      <FormInput
                        value={form.organizationName}
                        onChangeText={(value) => updateField('organizationName', value)}
                        placeholder="My Fitness Center"
                        leftIcon={<Building2 size={20} color="#666" />}
                      />
                      {validation.errors.organizationName && (
                        <FormControlError>
                          <FormControlErrorText>{validation.errors.organizationName}</FormControlErrorText>
                        </FormControlError>
                      )}
                    </FormControl>

                    <FormControl>
                      <FormControlLabel>
                        <FormControlLabelText>Country</FormControlLabelText>
                      </FormControlLabel>
                      <FormSelect
                        selectedValue={form.country}
                        onValueChange={(value) => updateField('country', value)}
                        options={countries}
                        placeholder="Select your country"
                        leftIcon={<Globe size={20} color="#666" />}
                      />
                    </FormControl>

                    <FormControl>
                      <FormControlLabel>
                        <FormControlLabelText>Currency</FormControlLabelText>
                      </FormControlLabel>
                      <FormSelect
                        selectedValue={form.currency}
                        onValueChange={(value) => updateField('currency', value)}
                        options={currencies}
                        placeholder="Select currency"
                        leftIcon={<DollarSign size={20} color="#666" />}
                      />
                    </FormControl>

                    <FormControl>
                      <FormControlLabel>
                        <FormControlLabelText>Timezone</FormControlLabelText>
                      </FormControlLabel>
                      <FormSelect
                        selectedValue={form.timezone}
                        onValueChange={(value) => updateField('timezone', value)}
                        options={timezones}
                        placeholder="Select timezone"
                        leftIcon={<Clock size={20} color="#666" />}
                      />
                    </FormControl>
                  </VStack>
                </Card>

              {/* Action Buttons */}
              <HStack className="gap-4 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onPress={() => router.back()}
                >
                  <ButtonText>Back</ButtonText>
                </Button>
                <Button 
                  className="flex-1"
                  onPress={handleNext}
                >
                  <ButtonText>Continue</ButtonText>
                  <Icon as={ChevronRight} className="ml-2" />
                </Button>
              </HStack>
            </VStack>
          ) : (
            <VStack className="gap-6">
              {/* Verification Step */}
              <Card className="p-5 rounded-lg">
                <VStack className="gap-4 items-center py-8">
                    <Text className="text-gray-600 text-center mb-4">
                      We've sent a 6-digit code to {form.email}
                    </Text>
                    
                    <FormControl>
                      <FormInput
                        value={form.verificationCode}
                        onChangeText={(value) => updateField('verificationCode', value)}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        className="text-center text-2xl"
                      />
                    </FormControl>

                    <Button
                      variant="link"
                      onPress={() => {
                        // TODO: Implement resend verification
                        toast.show({
                          placement: 'top',
                          render: ({ id }) => (
                            <Toast nativeID={id}>
                              <ToastTitle>Code Resent</ToastTitle>
                              <ToastDescription>Check your email for the new code</ToastDescription>
                            </Toast>
                          ),
                        });
                      }}
                    >
                      <ButtonText>Resend Code</ButtonText>
                    </Button>
                  </VStack>
                </Card>

              {/* Action Buttons */}
              <HStack className="gap-4 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onPress={() => {
                    setShowVerificationStep(false);
                    setCurrentStep(1);
                  }}
                >
                  <ButtonText>Back</ButtonText>
                </Button>
                <Button 
                  className="flex-1"
                  onPress={handleStartOnboarding}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <Spinner color="white" />
                  ) : (
                    <>
                      <ButtonText>Create Account</ButtonText>
                      <Icon as={ChevronRight} className="ml-2" />
                    </>
                  )}
                </Button>
              </HStack>
            </VStack>
          )}
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};