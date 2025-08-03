import React from 'react';
import { View, ScrollView } from 'react-native';
import { z } from 'zod';
import { 
  useForm, 
  FormProvider, 
  FormInput, 
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormRadio,
  FormSwitch,
  zodResolver,
  createSubmitHandler
} from './index';
import { GluestackButton as Button, ButtonText, VStack } from '../ui';

// Define your schema with Zod
const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  bio: z.string().optional(),
  country: z.string().min(1, 'Please select a country'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  accountType: z.enum(['personal', 'business'], {
    required_error: 'Please select an account type'
  }),
  notifications: z.boolean().default(false)
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export function ExampleRegistrationForm() {
  // Initialize form with Zod resolver
  const methods = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      bio: '',
      country: '',
      acceptTerms: false,
      accountType: 'personal',
      notifications: true
    }
  });

  // Create submit handler
  const handleSubmit = createSubmitHandler<RegistrationForm>(
    async (data) => {
      console.log('Form submitted:', data);
      // Handle form submission (e.g., API call)
    },
    (errors) => {
      console.log('Form errors:', errors);
    }
  );

  return (
    <ScrollView>
      <FormProvider {...methods}>
        <VStack className="gap-4 p-4">
          {/* Text Input */}
          <FormInput
            name="email"
            label="Email Address"
            description="We'll use this to send you updates"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password Input */}
          <FormInput
            name="password"
            label="Password"
            description="Must be at least 8 characters"
            placeholder="Enter password"
            secureTextEntry
          />

          {/* Textarea */}
          <FormTextarea
            name="bio"
            label="Bio"
            description="Tell us about yourself (optional)"
            placeholder="Enter your bio..."
            numberOfLines={4}
          />

          {/* Select */}
          <FormSelect
            name="country"
            label="Country"
            description="Select your country of residence"
            placeholder="Choose a country"
            options={[
              { label: 'United States', value: 'us' },
              { label: 'Canada', value: 'ca' },
              { label: 'United Kingdom', value: 'uk' },
              { label: 'Australia', value: 'au' },
              { label: 'Other', value: 'other' }
            ]}
          />

          {/* Radio Group */}
          <FormRadio
            name="accountType"
            label="Account Type"
            description="Choose the type of account you want to create"
            options={[
              { label: 'Personal Account', value: 'personal' },
              { label: 'Business Account', value: 'business' }
            ]}
          />

          {/* Switch */}
          <FormSwitch
            name="notifications"
            label="Email Notifications"
            description="Receive updates and promotions via email"
          />

          {/* Checkbox */}
          <FormCheckbox
            name="acceptTerms"
            label="Terms and Conditions"
            description="I agree to the terms of service and privacy policy"
          />

          {/* Submit Button */}
          <Button
            onPress={handleSubmit(methods)}
            className="mt-4"
          >
            <ButtonText>Register</ButtonText>
          </Button>

          {/* Reset Button */}
          <Button
            variant="outline"
            onPress={() => methods.reset()}
          >
            <ButtonText>Reset Form</ButtonText>
          </Button>
        </VStack>
      </FormProvider>
    </ScrollView>
  );
}