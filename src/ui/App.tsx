import * as React from "react";
import "./App.css";
import "./index.css";
import { __DEV__, DEVTOOLS_AGENT, DEVTOOLS_PANEL, getTabId } from "../shared";
import { DevtoolsMessage } from "../cs/consume";
import { devtoolsPortInDev } from "./shim";
import { ParsingReturn } from "../parser/_types";
import { FiberTreeViewWithRoots } from "./FiberTreeView";

function getNewPort(): chrome.runtime.Port {
  if (__DEV__) {
    return devtoolsPortInDev();
  }
  return chrome.runtime.connect({ name: "panel" });
}

interface PageMessageBase {
  tabId: number;
  source: string;
}

export type PageMessage = {
  type: "scan-result";
  data: ParsingReturn[];
  source: typeof DEVTOOLS_AGENT;
};

export enum DevtoolsMessageType {
  init = "init",
  scan = "scan",
}

const zoomFactor = 0.02;

function App() {
  const ref = React.useRef<HTMLDivElement | null>(null);
  let [port, setPort] = React.useState<chrome.runtime.Port | null>(getNewPort);

  let [result, setResult] = React.useState<ParsingReturn[] | null>(null);

  React.useLayoutEffect(() => {
    let targetElement = ref.current;
    if (!targetElement) {
      return;
    }

    let currentScale = +targetElement?.style.scale || 1;

    function onWheel(e: WheelEvent) {
      const isZoom = e.deltaY !== 0 && e.ctrlKey;
      if (isZoom) {
        // e.preventDefault();
        const isZoomIn = e.deltaY > 0;

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
  }, []);

  React.useEffect(() => {
    if (!port) {
      let newPort = getNewPort();
      setPort(newPort);
      return;
    }
    let disconnected = false;

    port.postMessage({
      source: DEVTOOLS_PANEL,
      type: DevtoolsMessageType.init,
      tabId: getTabId(),
    });

    port.onMessage.addListener(onMessageFromPage);
    port.onDisconnect.addListener(() =>
      port!.onMessage.removeListener(onMessageFromPage)
    );
    port.onDisconnect.addListener(onPortDisconnect);

    return onPortDisconnect;

    function onMessageFromPage(message: PageMessage) {
      if (disconnected) {
        return;
      }
      if (!__DEV__) {
        if (message.source !== DEVTOOLS_AGENT) {
          return;
        }
      }

      switch (message.type) {
        case "scan-result": {
          let data = message.data;
          setResult(data);
        }
      }
    }

    function onPortDisconnect() {
      if (disconnected) {
        return;
      }
      port!.onMessage.removeListener(onMessageFromPage);
      disconnected = true;
      setPort(null);
    }
  }, [port]);

  return (
    <div style={{}}>
      <div ref={ref} className="App">
        {port && (
          <div className="header">
            <button
              onClick={() =>
                port!.postMessage({
                  source: __DEV__ ? DEVTOOLS_PANEL : DEVTOOLS_PANEL,
                  type: DevtoolsMessageType.scan,
                  tabId: getTabId(),
                } as DevtoolsMessage)
              }
            >
              Refresh
            </button>
          </div>
        )}
        {result && <FiberTreeViewWithRoots results={result} />}
      </div>
    </div>
  );
}

export default App;
