import * as React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { __DEV__ } from "../shared";
import DevApp from "./DevApp";

// The extension is a React application, this is the index file or entrypoint
// the following is the host container and the React root for the devtools
let devtoolsHostContainer = document.getElementById("root") as HTMLElement;
let devtoolsRoot = ReactDOM.createRoot(devtoolsHostContainer);

if (__DEV__) {
  // in dev mode we render two roots to be able to spy on the first root
  // the first root will render a DevApp located in the DevApp.tsx file
  // the DevApp is the entrypoint to whatever we want to simulate in the dev
  // process.

  // we insert the DevApp before the actual devtools s its above it

  const container = document.createElement("div");
  container.id = "root_" + String(Date.now());
  document.body.insertBefore(container, devtoolsHostContainer);

  // first, render the dev app
  const devAppRoot = ReactDOM.createRoot(container);
  devAppRoot.render(
    <React.StrictMode>
      <DevApp />
      <hr />
    </React.StrictMode>
  );

  // then render the devtools
  devtoolsRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // in prod, render the devtools only
  devtoolsRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
