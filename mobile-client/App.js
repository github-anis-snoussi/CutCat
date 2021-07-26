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
import { BarCodeScanner } from "expo-barcode-scanner";
import axios from "axios";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;
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
  const [itemId, setItemId] = useState("");

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
          setItemId(resp.data);
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
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: "black" }]}>
      <Camera
        ref={cameraRef}
        style={styles.cameraContainer}
        type={Camera.Constants.Type.back}
        onCameraReady={onCameraReady}
        useCamera2Api={true}
        onBarCodeScanned={scanSessionQR}
        ratio={"4:3"}
      />

      {hasScannedItem && (
        <Image
          style={styles.overlayImage}
          source={{
            uri: `${SERVER_URL}static/uploads/item-${sessionId}-${itemId}.png`,
          }}
        />
      )}

      <View style={styles.buttomControlsContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!isCameraReady}
          onPress={onSnap}
          style={styles.capture}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  capture: {
    backgroundColor: "#5A45FF",
    height: 70,
    width: 70,
    borderRadius: 35,
  },
  cameraContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH * (4 / 3),
  },
  overlayImage: {
    position: "absolute",
    top: 0,
    right: 0,
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH * (4 / 3),
  },
  buttomControlsContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT - WINDOW_WIDTH * (4 / 3),
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
