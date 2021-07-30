import React, { Component } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

import TRANS from "./transparent.png";
import SOLID from "./solid.png";

export default class Loader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingProgress: new Animated.Value(0),
      isSolidLoaded: false,
      isTransLoaded: false,
      isAnimDone: false,
    };
  }

  componentDidUpdate(propsOld, stateOld) {
    const { isSolidLoaded, isTransLoaded } = this.state;
    const { isSolidLoaded: isSolidLoadedOld, isTransLoaded: isTransLoadedOld } =
      stateOld;

    if (
      isSolidLoaded !== isSolidLoadedOld ||
      isTransLoaded !== isTransLoadedOld
    ) {
      if (isSolidLoaded && isTransLoaded) {
        const { loadingProgress } = this.state;
        Animated.timing(loadingProgress, {
          toValue: 100,
          duration: 4000,
          useNativeDriver: true,
        }).start(this.setAnimDone);
      }
    }
  }

  render() {
    const { loadingProgress, isAnimDone } = this.state;

    const imgHeight = 1000;
    const imgWidth = 1000;
    const { height: winHeight, width: winWidth } = Dimensions.get("window");

    const imageTransform = [
      {
        scale: loadingProgress.interpolate({
          inputRange: [0, 5, 20, 100],
          outputRange: [1, 1, 0.8, 105],
        }),
      },
    ];
    const imageOpacity = loadingProgress.interpolate({
      inputRange: [0, 15, 30],
      outputRange: [1, 1, 0],
      extrapolate: "clamp",
    });

    const solidStyle = {
      position: "absolute",
      height: imgHeight,
      width: imgWidth,
      top: -imgHeight / 2 + winHeight / 2,
      left: -imgWidth / 2 + winWidth / 2,
      transform: imageTransform,
      opacity: imageOpacity,
    };

    const transStyle = {
      position: "absolute",
      height: imgHeight,
      width: imgWidth,
      top: -imgHeight / 2 + winHeight / 2,
      left: -imgWidth / 2 + winWidth / 2,
      transform: imageTransform,
    };

    const appAnimStyle = {
      transform: [
        {
          scale: loadingProgress.interpolate({
            inputRange: [0, 45, 100],
            outputRange: [1.1, 1, 1],
          }),
        },
      ],
    };

    return (
      <View style={styles.loadingWrap}>
        <Animated.View style={[styles.container, appAnimStyle]}>
          {this.props.children}
        </Animated.View>
        {!isAnimDone && (
          <Animated.Image
            source={TRANS}
            style={transStyle}
            onLoad={this.handleTransLoad}
            onError={this.handleTransError}
            fadeDuration={0}
          />
        )}
        {!isAnimDone && (
          <Animated.Image
            source={SOLID}
            style={solidStyle}
            onLoad={this.handleSolidLoad}
            onError={this.handleSolidError}
            fadeDuration={0}
          />
        )}
      </View>
    );
  }

  handleTransLoad = () => {
    console.log("trans loaded");
    this.setState(() => ({ isTransLoaded: true }));
  };
  handleSolidLoad = () => {
    console.log("solid loaded");
    this.setState(() => ({ isSolidLoaded: true }));
  };
  handleTransError = () => {
    console.log("trans errored");
    this.setState(() => ({ isTransLoaded: true }));
  };
  handleSolidError = (e) => {
    console.log(
      "solid errored, e:",
      Object.keys(e),
      JSON.stringify(e.nativeEvent)
    );
    this.setState(() => ({ isSolidLoaded: true }));
  };
  setAnimDone = () => this.setState(() => ({ isAnimDone: true }));
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
