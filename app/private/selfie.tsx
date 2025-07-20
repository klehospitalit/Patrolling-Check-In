import { APP_BASE_API } from "@/constants/config";
import { useAuth } from "@/hooks/useAuth";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { CameraCapturedPicture } from "expo-camera/build/Camera.types";
import * as Location from "expo-location";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function Selfie() {
  const { guardId, checkpostId } = useLocalSearchParams<{
    guardId: string;
    checkpostId: string;
  }>();

  const [facing, setFacing] = useState<CameraType>("front");
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [shouldRenderCamera, setShouldRenderCamera] = useState(false);
  const [loading, setLoading] = useState(false);

  const { logout, userId } = useAuth();

  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setShouldRenderCamera(false);
      const timeout = setTimeout(() => {
        if (!active) return;
        setFacing("back");
        setTimeout(() => {
          if (!active) return;
          setFacing("front");
          setShouldRenderCamera(true);
        }, 200);
      }, 300);
      return () => {
        active = false;
        clearTimeout(timeout);
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const takePicture = async () => {
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync();
      setPhoto(result);
    }
  };

  const submitAttendance = async () => {
    if (!photo) {
      alert("Please take a selfie first");
      return;
    }
  
    setLoading(true);
  
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        setLoading(false);
        return;
      }
  
      const location = await Location.getCurrentPositionAsync({});
      const formData = new FormData();
      formData.append("user_id", userId! || "user_id not found.");
      formData.append("checkpoint_id", checkpostId);
      formData.append("latitude", location.coords.latitude.toString());
      formData.append("longitude", location.coords.longitude.toString());
      formData.append("photo", {
        uri: photo.uri,
        name: "selfie.jpg",
        type: "image/jpeg",
      } as any);
  
      const response = await fetch(`${APP_BASE_API}/submit`, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });
  
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
  
      const data = await response.json();
      console.log("Response:", data);
  
      if (data?.errorcode === "invalid user") {
        Alert.alert(
          "Invalid User",
          "Your session is invalid. Please re-login.",
          [
            {
              text: "Re-login",
              onPress: async() => {
                await logout();
    router.replace("/"); 
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          "Success",
          "Attendance submitted successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                router.push({
                  pathname: "/private/qr-scan",
                });
                BackHandler.exitApp();
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit attendance. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.message}>We need your permission to show the camera</Text>
          <Button onPress={requestPermission} title="Grant permission" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Submitting attendance...</Text>
          </View>
        ) : photo ? (
          <>
            <Image source={{ uri: photo.uri }} style={styles.image} />
            <View style={[styles.submitButtonWrapper, { marginBottom: insets.bottom + 10 }]}>
              <Button title="Submit Attendance" onPress={submitAttendance} />
            </View>
          </>
        ) : (
          shouldRenderCamera && (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              enableTorch={false}
              mode="picture"
            >
              <View style={[styles.controls, { marginBottom: insets.bottom + 10 }]}>
                <TouchableOpacity onPress={takePicture} style={styles.button}>
                  <Text style={styles.text}>Capture</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  text: {
    fontWeight: "bold",
    color: "#000",
  },
  message: {
    textAlign: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  submitButtonWrapper: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
  },
});
