import { BaseResource } from './base';
import {
  StartOnboardingData,
  StartOnboardingResponse,
  UpdateGymSettingsData,
  ConfigureFeaturesData,
  CompleteGuidedSetupData,
  OnboardingStatus,
  OnboardingResponse,
} from '../models/onboarding';

export class OnboardingResource extends BaseResource {
  /**
   * Creates owner account, organization, and initial gym
   * Now also sends verification and organization codes via email
   */
  async start(data: StartOnboardingData): Promise<StartOnboardingResponse> {
    const response = await this.client.post<StartOnboardingResponse>('/onboarding/start', data);
    
    // Store tokens after successful onboarding start
    if (response.access_token) {
      this.client.setAuthToken(response.access_token);
    }
    
    return response;
  }

  /**
   * Updates basic gym settings (step 2 of onboarding)
   * Configure basic gym information like name, address, etc.
   */
  async updateGymSettings(data: UpdateGymSettingsData): Promise<OnboardingResponse> {
    return this.client.put<OnboardingResponse>('/onboarding/gym-settings', data);
  }

  /**
   * Configure gym features (step 3 of onboarding)
   * Enable/disable various management features
   */
  async configureFeatures(data: ConfigureFeaturesData): Promise<OnboardingResponse> {
    return this.client.put<OnboardingResponse>('/onboarding/configure-features', data);
  }

  /**
   * Mark onboarding as complete
   */
  async completeSetup(data: CompleteGuidedSetupData): Promise<OnboardingResponse> {
    return this.client.post<OnboardingResponse>('/onboarding/complete', data);
  }

  /**
   * Get current onboarding status
   * Check progress and next steps
   */
  async getStatus(gymId: string): Promise<OnboardingStatus> {
    return this.client.get<OnboardingStatus>(`/onboarding/status/${gymId}`);
  }
}