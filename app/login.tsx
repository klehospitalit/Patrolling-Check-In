import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function LoginScreen() {
  const [guardId, setGuardId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { isLoggedIn, login, loading } = useAuth();

  if (isLoggedIn) {
    return <Redirect href="/private/qr-scan" />;
  }

  const handleLogin = async () => {
    const trimmedId = guardId.trim();
    if (!trimmedId) {
      Alert.alert("Validation Error", "Please enter a valid Guard ID.");
      return;
    }

    try {
      setSubmitting(true);
      const errorMessage = await login(trimmedId);
      if (errorMessage) {
        Alert.alert("Login Failed", errorMessage);
      }
    } catch (error) {
      console.log("Unexpected login error:", error);
      Alert.alert("Login Failed", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.gradientBackground}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Image
                source={require("../assets/images/headlogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.label}>Enter your ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., guard1"
                value={guardId}
                onChangeText={setGuardId}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#888"
              />
              <View style={styles.buttonContainer}>
                {submitting || loading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Button title="Login" onPress={handleLogin} color="#007AFF" />
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradientBackground: {
    flex: 1,
    backgroundColor: "#00416A",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    color: "#00416A",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    marginTop: 8,
  },
  logo: {
    // width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 16,
  },
});
