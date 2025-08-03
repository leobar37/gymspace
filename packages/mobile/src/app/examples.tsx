import React, { useState } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { AnimatedCard } from "../components/AnimatedCard";
import { LoginForm } from "../components/LoginForm";
import { counterAtom, userAtom } from "../store/atoms";
import { userApi } from "../api/userApi";
import { Link } from "expo-router";
import {
  Button,
  Toast,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Avatar,
  AvatarGroup,
  Switch,
  Checkbox,
  Select,
  Progress,
  Spinner,
  Divider,
} from "../components/ui";

export default function ExamplesScreen() {
  const [counter, setCounter] = useAtom(counterAtom);
  const [user] = useAtom(userAtom);
  const [showToast, setShowToast] = useState(false);
  const [toastVariant, setToastVariant] = useState<'default' | 'success' | 'error' | 'warning'>('default');
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [selectValue, setSelectValue] = useState('');

  // Example of TanStack Query usage
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: userApi.fetchUsers,
  });

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="py-6">
        <Text className="text-3xl font-bold text-center mb-6">
          Library Examples
        </Text>

        {/* GlueStack UI Components */}
        <View className="mb-8">
          <Text className="text-xl font-semibold px-4 mb-3">
            GlueStack UI Components
          </Text>
          
          <View className="px-4 space-y-3">
            <Button 
              onPress={() => {
                setToastVariant('success');
                setShowToast(true);
              }}
            >
              Show Success Toast
            </Button>
            
            <Button 
              variant="secondary"
              onPress={() => {
                setToastVariant('error');
                setShowToast(true);
              }}
            >
              Show Error Toast
            </Button>
            
            <Button variant="outline" size="lg">
              Outline Button Large
            </Button>
            
            <Button variant="ghost" size="sm">
              Ghost Button Small
            </Button>
            
            <Button loading>
              Loading Button
            </Button>
            
            <Button disabled>
              Disabled Button
            </Button>
          </View>
          
          {showToast && (
            <View className="px-4 mt-4">
              <Toast 
                title={toastVariant === 'success' ? 'Success!' : 'Error!'}
                description={
                  toastVariant === 'success' 
                    ? 'GlueStack UI is working correctly' 
                    : 'Something went wrong'
                }
                variant={toastVariant}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onPress={() => setShowToast(false)}
                className="mt-2"
              >
                Hide Toast
              </Button>
            </View>
          )}
        </View>

        {/* More GlueStack UI Components */}
        <View className="mb-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Component</CardTitle>
              <CardDescription>
                A beautiful card with header, content, and footer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <View className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Enter your name"
                  value=""
                />
                
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value=""
                  error="Invalid email format"
                />
                
                <Select
                  label="Country"
                  value={selectValue}
                  onValueChange={setSelectValue}
                  placeholder="Select your country"
                  options={[
                    { label: 'United States', value: 'us' },
                    { label: 'Canada', value: 'ca' },
                    { label: 'Mexico', value: 'mx' },
                  ]}
                />
                
                <Switch
                  label="Enable notifications"
                  value={switchValue}
                  onValueChange={setSwitchValue}
                />
                
                <Checkbox
                  label="I agree to the terms"
                  checked={checkboxValue}
                  onCheckedChange={setCheckboxValue}
                />
                
                <Divider>OR</Divider>
                
                <View className="flex-row space-x-2">
                  <Badge>Default</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="warning">Warning</Badge>
                </View>
                
                <Progress value={65} />
                
                <AvatarGroup>
                  <Avatar fallback="JD" size="md" />
                  <Avatar fallback="AS" size="md" />
                  <Avatar fallback="MK" size="md" />
                  <Avatar fallback="LB" size="md" />
                  <Avatar fallback="TC" size="md" />
                </AvatarGroup>
              </View>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="mr-2">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </View>

        {/* Jotai State Example */}
        <View className="mb-8">
          <Text className="text-xl font-semibold px-4 mb-3">
            Jotai State Management
          </Text>
          <AnimatedCard
            title={`Counter: ${counter}`}
            description="Tap to increment the counter (using Jotai atom)"
            onPress={() => setCounter((prev) => prev + 1)}
          />
          {user && (
            <View className="mx-4 mt-2 p-4 bg-green-100 rounded-lg">
              <Text className="text-green-800">
                Logged in as: {user.email}
              </Text>
            </View>
          )}
        </View>

        {/* React Hook Form + Zod Example */}
        <View className="mb-8">
          <Text className="text-xl font-semibold px-4 mb-3">
            React Hook Form + Zod Validation
          </Text>
          <LoginForm />
        </View>

        {/* TanStack Query Example */}
        <View className="mb-8">
          <Text className="text-xl font-semibold px-4 mb-3">
            TanStack Query Data Fetching
          </Text>
          {isLoading && (
            <ActivityIndicator size="large" className="my-4" />
          )}
          {error && (
            <Text className="text-red-500 px-4">
              Error loading users
            </Text>
          )}
          {isLoading && (
            <View className="py-8">
              <Spinner label="Loading users..." />
            </View>
          )}
          {users?.map((user) => (
            <AnimatedCard
              key={user.id}
              title={user.name}
              description={user.email}
            />
          ))}
        </View>

        {/* Navigation Example */}
        <View className="px-4 mb-8">
          <Link href="/" asChild>
            <Text className="text-blue-500 text-center text-lg underline">
              Back to Home
            </Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}