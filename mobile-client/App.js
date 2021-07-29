import React from "react";
import Main from './Components/Main'
import Loader from './Components/Loader'

export default function App() {
  return (
    <Loader>
      <Main />
    </Loader>
  );
}

