import { EmailVerification } from '@/features/auth/components/EmailVerification';
import { OnboardingStepsContainer } from '@/features/onboarding/components/OnboardingStepsContainer';
import { useOnboardingStore } from '@/store/onboarding';
import { useAuthToken } from '@/hooks/useAuthToken';
import { router } from 'expo-router';
import React from 'react';

export default function EmailVerificationScreen() {
  const { ownerData, setEmailVerified, emailVerified, tempAuthTokens, setVerificationCode } = useOnboardingStore();
  const { storeTokens } = useAuthToken();

  // Redirect if no owner data (shouldn't happen with proper navigation)
  if (!ownerData) {
    router.replace('/');
    return null;
  }

  const handleSuccess = async (verificationCode: string) => {
    setEmailVerified(true);
    setVerificationCode(verificationCode); // Store the verification code for later use in welcome screen
    
    // Apply the temporary tokens now that email is verified
    if (tempAuthTokens) {
      await storeTokens({
        accessToken: tempAuthTokens.accessToken,
        refreshToken: tempAuthTokens.refreshToken,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
      });
    }
    
    router.replace('/owner/welcome');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <OnboardingStepsContainer
      currentStep={2}
      totalSteps={7}
      onBackPress={handleBack}
    >
      {/* Email Verification Component */}
      {!emailVerified && <EmailVerification
        email={ownerData.email}
        onSuccess={handleSuccess}
        onBack={handleBack}
      />}
    </OnboardingStepsContainer>
  );
}