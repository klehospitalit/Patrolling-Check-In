import { APP_BASE_API } from "@/constants/config";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function QRScan() {
  const { guardId } = useLocalSearchParams<{ guardId: string }>();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(true); // 👈 control camera view

  const hasScannedRef = useRef(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera access is required to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (hasScannedRef.current || loading) return;

    hasScannedRef.current = true;
    setCameraActive(false); // 👈 hide camera
    setLoading(true);

    const checkpostId = result.data;

    try {
      const res = await fetch(`${APP_BASE_API}/verify_checkpoint`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkpostId),
      });

      console.log(res);

      const json = await res.json();

      if (json.status === "ok") {
        router.push({
          pathname: "/private/selfie",
          params: { guardId, checkpostId },
        });
      } else {
        Alert.alert("Invalid Checkpoint", json.message || "Checkpoint verification failed");
        setCameraActive(false); // ensure camera stays off until rescan
        hasScannedRef.current = false;
      }
    } catch (err) {
      Alert.alert("Error", "Failed to verify checkpoint");
      setCameraActive(false);
      hasScannedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {cameraActive && !loading && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleBarCodeScanned}
        />
      )}

      <View style={styles.overlay}>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            {!cameraActive && (
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={() => {
                  hasScannedRef.current = false;
                  setCameraActive(true); // 👈 turn camera back on
                }}
              >
                <Text style={styles.rescanText}>Scan Again</Text>
              </TouchableOpacity>
            )}
            {cameraActive && (
              <>
                <Text style={styles.instructions}>
                  Align the QR code within the frame
                </Text>
                <View style={styles.frame} />
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 20,
  },
  instructions: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  frame: {
    width: 250,
    height: 250,
    borderColor: "#00FFAA",
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  rescanButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
  rescanText: {
    color: "#fff",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
