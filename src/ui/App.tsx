import * as React from "react";
import { __DEV__, DEVTOOLS_AGENT, DEVTOOLS_PANEL, getTabId } from "../shared";
import { devtoolsPortInDev } from "./shim";
import { ParsingReturn } from "../bg/parser/_types";
import { FiberTreeViewWithRoots } from "./FiberTreeView/FiberTreeView";
import { DevtoolsProvider } from "./context";
import { Controls } from "./FiberTreeView/Controls";
import { PageMessage } from "../_types";

export default function App() {
  let ref = React.useRef<HTMLDivElement | null>(null);
  let [result, setResult] = React.useState<ParsingReturn[] | null>(null);
  let [port, setPort] = React.useState<chrome.runtime.Port | null>(getNewPort);

  // enable zoom using wheel or gestures
  React.useLayoutEffect(registerWheelZoomOnContainer.bind(null, ref), []);

  // subscribe to the runtime port to received messages
  // state setters can be ignored from deps arrays ;)
  React.useEffect(subscribeToPort.bind(null, port, setPort, setResult), [port]);

  return (
    <DevtoolsProvider>
      <Controls targetElementRef={ref} port={port} />
      <div ref={ref} className="App">
        {result && <FiberTreeViewWithRoots results={result} />}
      </div>
    </DevtoolsProvider>
  );
}

// will construct the chrome.runtime.Port object
// in dev mode, it falls back to the one defined in shim.ts
function getNewPort(): chrome.runtime.Port {
  if (__DEV__) {
    return devtoolsPortInDev();
  }
  return chrome.runtime.connect({ name: "panel" });
}

// this runs as a passive effect (useEffect)
function subscribeToPort(
  port: chrome.runtime.Port | null,
  setPort: React.Dispatch<React.SetStateAction<chrome.runtime.Port | null>>,
  setState: React.Dispatch<React.SetStateAction<ParsingReturn[] | null>>
) {
  if (!port) {
    let newPort = getNewPort();
    setPort(newPort);
    return;
  }

  let disconnected = false;
  port.onMessage.addListener(onMessageFromPage);
  port.onDisconnect.addListener(onPortDisconnect);

  // post the init message, the agent will respond with the scan result
  port.postMessage({
    type: "init",
    tabId: getTabId(),
    source: DEVTOOLS_PANEL,
  });

  return onPortDisconnect;

  function onMessageFromPage(message: PageMessage) {
    if (!disconnected) {
      // only allow the agent to speak with this
      // in dev mode, the shim sends this too
      if (message.source === DEVTOOLS_AGENT) {
        // we only support the scan result type for now
        // scan-result will give all roots on page with all their fiber tree
        switch (message.type) {
          case "scan-result": {
            setState(message.data);
          }
        }
      }
    } else {
      // being here means a bug, how it did disconnect without unsubscribe?
      onPortDisconnect();
    }
  }

  function onPortDisconnect() {
    if (!disconnected) {
      disconnected = true;

      setPort(null);
      port!.onMessage.removeListener(onMessageFromPage);
    }
  }
}

const zoomFactor = 0.02;
// this will register the onWheel event on the target element in layout effect
function registerWheelZoomOnContainer(
  reactRef: React.MutableRefObject<HTMLDivElement | null>
) {
  let targetElement = reactRef.current;
  if (!targetElement) {
    return;
  }

  let currentScale = +targetElement?.style.scale || 1;

  function onWheel(e: WheelEvent) {
    let isZoom = e.deltaY !== 0 && e.ctrlKey;
    if (isZoom) {
      // e.preventDefault();
      let isZoomIn = e.deltaY > 0;

      let newScale = isZoomIn
        ? currentScale - zoomFactor
        : currentScale + zoomFactor;

      currentScale = Math.max(0.1, Math.min(2, newScale));
      targetElement!.style.scale = "" + currentScale;
    }
  }

  targetElement?.addEventListener("wheel", onWheel);
  return () => {
    targetElement?.removeEventListener("wheel", onWheel);
  };
}
