import { Redirect } from "expo-router";

export default function HomeScreen() {
  // Redirect to onboarding by default
  // The onboarding layout will handle redirecting to (app) if authenticated
  return <Redirect href="/(onboarding)" />;
}