import { View, Text } from "react-native";

export default function TestNativeWind() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-500">
      <Text className="text-white text-2xl font-bold">
        NativeWind is working!
      </Text>
      <View className="mt-4 p-4 bg-white rounded-lg">
        <Text className="text-black">If you see styled text, it works!</Text>
      </View>
    </View>
  );
}