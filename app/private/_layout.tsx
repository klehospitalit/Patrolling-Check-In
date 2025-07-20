import { useAuth } from "@/hooks/useAuth";
import { Stack, usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PrivateLayout() {
  const { logout, userName } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const screenTitleMap: Record<string, string> = {
    "/private/qr-scan": "Scan Checkpost",
    "/private/selfie": "Capture Selfie",
  };

  const screenTitle = screenTitleMap[pathname] || "";

  const handleLogout = async () => {
    await logout();
    router.replace("/"); // or router.push("/"), based on your routing structure
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Row 1: App name and user info */}
        <View style={styles.topRow}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.userText}>
            👮 {userName}
          </Text>
          <View style={styles.userSection}>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Page title */}
        <View style={styles.bottomRow}>
          <Text style={styles.title}>{screenTitle}</Text>
        </View>
      </View>

      {/* Screens */}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F9FC",
  },
  header: {
    backgroundColor: "#1A1A2E",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: {
    color: "#bbb",
    fontSize: 13,
    fontWeight: "500",
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "60%", // limit width to avoid overflow
    flexShrink: 1,
  },
  userText: {
    color: "#eee",
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
    maxWidth: "80%", // makes sure long names don’t overflow
  },
  logout: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomRow: {
    marginTop: 6,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
});
