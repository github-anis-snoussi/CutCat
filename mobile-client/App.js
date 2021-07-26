import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { Camera } from "expo-camera";
import { AntDesign } from "@expo/vector-icons";
import { BarCodeScanner } from "expo-barcode-scanner";
import axios from "axios";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;
const CAPTURE_SIZE = Math.floor(WINDOW_HEIGHT * 0.08);
const SESSION_RE =
  /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/;
const SERVER_URL = "http://192.168.1.19:5000/";

export default function App() {
  const cameraRef = useRef();
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanningQR, setIsScanningQR] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [hasScannedItem, setHasScannedItem] = useState(false);

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
    if (cameraRef.current && sessionId !== "") {
      const options = { quality: 0.7 };
      const data = await cameraRef.current.takePictureAsync(options);

      // this the file returned by the camera
      let localUri = data.uri;
      let filename = localUri.split("/").pop();

      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      formData.append("image", { uri: localUri, name: filename, type });
      formData.append("session-id", sessionId);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data;",
        },
      };

      axios
        .post(SERVER_URL + "add_item", formData, config)
        .then((resp) => {
          console.log("all went well");
          setHasScannedItem(true);
        })
        .catch((err) => {
          console.log("something not working : ", err.response);
        });
    }
  };

  const scanSessionQR = ({ type, data }) => {
    if (isScanningQR) {
      setIsScanningQR(false);
      if (
        type === BarCodeScanner.Constants.BarCodeType.qr &&
        SESSION_RE.test(data)
      ) {
        setSessionId(data);
        alert("Connected to session!");
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
    <View style={[styles.container, { backgroundColor: "black" }]}>
      <Camera
        ref={cameraRef}
        style={styles.camerqContainer}
        type={Camera.Constants.Type.back}
        onCameraReady={onCameraReady}
        useCamera2Api={true}
        onBarCodeScanned={scanSessionQR}
        ratio={"4:3"}
      />
      <View style={styles.container}>
        {hasScannedItem && (
          <Image
            style={{ width: 50, height: 50 }}
            source={{
              uri: `${SERVER_URL}static/uploads/item-${sessionId}.png`,
            }}
          />
        )}

        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!isCameraReady}
            onPress={onSnap}
            style={styles.capture}
          />
        </View>
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
  camerqContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH * (4 / 3),
  },
});
