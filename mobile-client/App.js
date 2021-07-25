import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Camera } from "expo-camera";
import { AntDesign } from "@expo/vector-icons";
import { BarCodeScanner } from "expo-barcode-scanner";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const CAPTURE_SIZE = Math.floor(WINDOW_HEIGHT * 0.08);

const SESSION_RE =
  /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/;

export default function App() {
  const cameraRef = useRef();
  const [hasPermission, setHasPermission] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(true);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    onHandlePermission();
  }, []);

  const onHandlePermission = async () => {
    const { status } = await Camera.requestPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const onSnap = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.7, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      const source = data.base64;

      if (source) {
        await cameraRef.current.pausePreview();
        setIsPreview(true);

        let base64Img = `data:image/jpg;base64,${source}`;
        let apiUrl = "http://cutcat.web/upload";
        let data = {
          file: base64Img,
          host_session_id: "<your-upload-preset>",
        };

        fetch(apiUrl, {
          body: JSON.stringify(data),
          headers: {
            "content-type": "application/json",
          },
          method: "POST",
        })
          .then(async (response) => {
            let data = await response.json();
            if (data.secure_url) {
              alert("Upload successful");
            }
          })
          .catch((err) => {
            alert("Cannot upload");
            console.log(err);
          });
      }
    }
  };

  const cancelPreview = async () => {
    await cameraRef.current.resumePreview();
    setIsPreview(false);
  };

  const scanSessionDetails = ({ type, data }) => {
    if (isScanningQR) {
      setIsScanningQR(false);
      if (
        type === BarCodeScanner.Constants.BarCodeType.qr &&
        SESSION_RE.test(data)
      ) {
        setSessionId(data);
        console.log("scanned QR code : ", data);
      } else {
        setIsScanningQR(true);
      }
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text style={styles.text}>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.container}
        type={Camera.Constants.Type.back}
        onCameraReady={onCameraReady}
        useCamera2Api={true}
        onBarCodeScanned={scanSessionDetails}
      />
      <View style={styles.container}>
        {isPreview && (
          <TouchableOpacity
            onPress={cancelPreview}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <AntDesign name="close" size={32} color="#fff" />
          </TouchableOpacity>
        )}
        {!isPreview && (
          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={!isCameraReady}
              onPress={onSnap}
              style={styles.capture}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    color: "#fff",
  },
  bottomButtonsContainer: {
    position: "absolute",
    flexDirection: "row",
    bottom: 28,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 35,
    right: 20,
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5A45FF",
    opacity: 0.7,
  },
  capture: {
    backgroundColor: "#5A45FF",
    borderRadius: 5,
    height: CAPTURE_SIZE,
    width: CAPTURE_SIZE,
    borderRadius: Math.floor(CAPTURE_SIZE / 2),
    marginBottom: 28,
    marginHorizontal: 30,
  },
});
