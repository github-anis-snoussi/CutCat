import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { Camera } from "expo-camera";
import { BarCodeScanner } from "expo-barcode-scanner";
import axios from "axios";

import StepIndicator from "react-native-step-indicator";

const labels = ["CONNECT", "CUT", "PASTE"];
const customStyles = {
  stepIndicatorSize: 25,
  currentStepIndicatorSize: 30,
  separatorStrokeWidth: 2,
  currentStepStrokeWidth: 3,
  stepStrokeCurrentColor: "#4087b9",
  stepStrokeWidth: 3,
  stepStrokeFinishedColor: "#4087b9",
  stepStrokeUnFinishedColor: "#aaaaaa",
  separatorFinishedColor: "#4087b9",
  separatorUnFinishedColor: "#aaaaaa",
  stepIndicatorFinishedColor: "#4087b9",
  stepIndicatorUnFinishedColor: "#ffffff",
  stepIndicatorCurrentColor: "#ffffff",
  stepIndicatorLabelFontSize: 13,
  currentStepIndicatorLabelFontSize: 13,
  stepIndicatorLabelCurrentColor: "#4087b9",
  stepIndicatorLabelFinishedColor: "#ffffff",
  stepIndicatorLabelUnFinishedColor: "#aaaaaa",
  labelColor: "#999999",
  labelSize: 13,
  currentStepLabelColor: "#4087b9",
};

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;
const SESSION_RE =
  /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/;
const SERVER_URL = "http://192.168.1.19:5000/";

export default function Main() {
  const cameraRef = useRef();
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [itemId, setItemId] = useState("");
  const [appStatus, setAppStatus] = useState("scanning-qr"); // can be: scanning-qr || loading || scaning-item || pointing-item
  const [currentPosition, setCurrentPosition] = useState(0);

  const [dots, setDots] = useState(1);
  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prevDots) => (prevDots === 3 ? 0 : prevDots + 1));
    }, 600);
    return () => {
      clearTimeout(timer);
    };
  }, []);

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
      setAppStatus("loading");
      const options = { quality: 0.7 };
      const data = await cameraRef.current.takePictureAsync(options);

      // this the file returned by the camera
      let localUri = data.uri;
      let filename = localUri.split("/").pop();

      // Infer the type of the image
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      if (appStatus === "scaning-item") {
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
            setAppStatus("pointing-item");
            setCurrentPosition(2);
          })
          .catch((err) => {
            setAppStatus("scaning-item");
            setCurrentPosition(1);
            console.log("something not working : ", err.response);
          });
      } else if (appStatus === "pointing-item") {
        // Upload the image using the fetch and FormData APIs
        let formData = new FormData();
        // Assume "photo" is the name of the form field the server expects
        formData.append("view", { uri: localUri, name: filename, type });
        formData.append("session-id", sessionId);
        formData.append("item-id", itemId.toString());

        const config = {
          headers: {
            "Content-Type": "multipart/form-data;",
          },
        };

        axios
          .post(SERVER_URL + "point_item", formData, config)
          .then((resp) => {
            console.log("all went well: ", resp.data);
            setAppStatus("scaning-item");
            setCurrentPosition(1);
          })
          .catch((err) => {
            setAppStatus("pointing-item");
            setCurrentPosition(2);
            console.log("something not working : ", err.response);
          });
      }
    }
  };

  const scanSessionQR = ({ type, data }) => {
    if (appStatus === "scanning-qr") {
      setAppStatus("loading");
      if (
        type === BarCodeScanner.Constants.BarCodeType.qr &&
        SESSION_RE.test(data)
      ) {
        setSessionId(data);
        setAppStatus("scaning-item");
        setCurrentPosition(1);
      } else {
        setAppStatus("scanning-qr");
        setCurrentPosition(0);
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
    <View style={[styles.container, { backgroundColor: "#1e162d" }]}>
      <StatusBar hidden={true} />
      <View
        style={{
          height: 30,
          backgroundColor: "#1e162d",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingRight: 20,
        }}
      >
        {appStatus !== "scanning-qr" ? (
          <View
            style={{
              height: 12,
              width: 12,
              borderRadius: 6,
              backgroundColor: "green",
            }}
          />
        ) : null}
      </View>

      <Camera
        ref={cameraRef}
        style={styles.cameraContainer}
        type={Camera.Constants.Type.back}
        onCameraReady={onCameraReady}
        useCamera2Api={true}
        onBarCodeScanned={scanSessionQR}
        ratio={"4:3"}
      ></Camera>

      {appStatus === "loading" ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            backgroundColor: "rgba(30, 22, 44, 0.32)",
            width: WINDOW_WIDTH,
            height: WINDOW_WIDTH * (4 / 3),
            justifyContent: "center",
            alignItems: "center",
            marginTop: 30,
          }}
        >
          <Image
            source={require("../assets/cat.gif")}
            style={{ width: 150, height: 150 }}
          />

          <Text
            style={{
              color: "white",
              fontWeight: "bold",
              fontSize: 18,
              marginTop: 10,
            }}
          >
            Loading {dots === 0 ? "" : ".".repeat(dots)}
          </Text>
        </View>
      ) : null}

      {appStatus === "pointing-item" && (
        <Image
          style={styles.overlayImage}
          source={{
            uri: `${SERVER_URL}static/uploads/item-${sessionId}-${itemId}.png`,
          }}
        />
      )}

      <View style={styles.buttomControlsContainer}>
        <View style={{ width: "100%", marginBottom: 20 }}>
          <StepIndicator
            customStyles={customStyles}
            currentPosition={currentPosition}
            labels={labels}
            direction={"horizontal"}
            stepCount={3}
          />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!isCameraReady}
          onPress={onSnap}
          style={styles.capture}
        >
          <Image
            style={styles.logoImage}
            source={require("../assets/logo-white.png")}
          />
        </TouchableOpacity>

        <Text style={{ color: "white" }}> {appStatus} </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  capture: {
    backgroundColor: "#4087b9",
    height: 90,
    width: 90,
    borderRadius: 45,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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
    height: WINDOW_HEIGHT - WINDOW_WIDTH * (4 / 3) - 30,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    height: 60,
    width: 60,
    resizeMode: "contain",
  },
});
