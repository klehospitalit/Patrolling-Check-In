// app/_layout.tsx
import { useAuth } from "@/hooks/useAuth";
import { Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
  const { isLoggedIn, loading, userId } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
