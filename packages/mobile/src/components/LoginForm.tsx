import { zodResolver } from "@hookform/resolvers/zod";
import { useSetAtom } from "jotai";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSecureStorage } from "@/hooks/useSecureStorage";
import { LoginFormData, loginSchema } from "@/schemas/userSchema";
import { userAtom } from "@/store/atoms";

export function LoginForm() {
  const setUser = useSetAtom(userAtom);
  const { setItem } = useSecureStorage();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Store token securely
      await setItem("authToken", "mock-jwt-token");

      // Update global state
      setUser({
        name: "John Doe",
        email: data.email,
      });

      Alert.alert("Success", "Logged in successfully!");
    } catch (error) {
      Alert.alert("Error", "Login failed. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-800 mb-8">Login</Text>

        <View className="mb-4">
          <Text className="text-gray-700 mb-2">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg px-4 py-3 text-gray-800 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.email && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </Text>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2">Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg px-4 py-3 text-gray-800 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                secureTextEntry
              />
            )}
          />
          {errors.password && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </Text>
          )}
        </View>

        <TouchableOpacity
          className={`rounded-lg py-4 ${
            isSubmitting ? "bg-gray-400" : "bg-blue-500"
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isSubmitting ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}