import React from 'react';
import { SafeAreaView, ScrollView, Pressable } from 'react-native';
import { 
  VStack, 
  HStack,
  Center, 
  Heading, 
  Text, 
  GluestackButton as Button, 
  ButtonText,
  Box,
  GluestackCard as Card
} from '../../components/ui';
import { useGymSdk } from '../../providers/GymSdkProvider';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { clearAuth } = useGymSdk();

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/(onboarding)');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <ScrollView className="flex-1">
        <VStack className="p-4 gap-6">
          {/* Welcome Section */}
          <VStack className="gap-2">
            <Heading className="text-gray-900 text-2xl font-bold">
              Welcome to GymSpace
            </Heading>
            <Text className="text-gray-600">
              You're now logged in! This is where your main app content would go.
            </Text>
          </VStack>

          {/* Stats Cards */}
          <HStack className="gap-4">
            <Card className="flex-1 p-4 bg-white">
              <Text className="text-gray-500 text-sm">Total Members</Text>
              <Heading className="text-gray-900 mt-1 text-xl font-bold">
                0
              </Heading>
            </Card>
            
            <Card className="flex-1 p-4 bg-white">
              <Text className="text-gray-500 text-sm">Active Today</Text>
              <Heading className="text-gray-900 mt-1 text-xl font-bold">
                0
              </Heading>
            </Card>
          </HStack>

          {/* Quick Actions */}
          <VStack className="gap-4">
            <Text className="text-lg font-semibold text-gray-900">
              Quick Actions
            </Text>
            
            <Card className="p-4 bg-white">
              <Text className="text-gray-700 font-medium mb-2">Add New Member</Text>
              <Text className="text-gray-500 text-sm">
                Register a new member to your gym
              </Text>
            </Card>

            <Card className="p-4 bg-white">
              <Text className="text-gray-700 font-medium mb-2">Check-in Member</Text>
              <Text className="text-gray-500 text-sm">
                Record member attendance
              </Text>
            </Card>

            <Card className="p-4 bg-white">
              <Text className="text-gray-700 font-medium mb-2">View Reports</Text>
              <Text className="text-gray-500 text-sm">
                Access analytics and insights
              </Text>
            </Card>
          </VStack>

          {/* Logout Button */}
          <Button
            onPress={handleLogout}
            variant="outline"
            className="mt-8 py-3 px-6"
          >
            <ButtonText>Logout</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}