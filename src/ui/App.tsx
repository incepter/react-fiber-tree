import * as React from "react";
import "./App.css";
import "./index.css";
import { __DEV__, DEVTOOLS_AGENT, DEVTOOLS_PANEL, getTabId } from "../shared";
import { DevtoolsMessage } from "../cs/consume";
import { devtoolsPortInDev } from "./shim";
import { ParsingReturn } from "../parser/_types";
import { FiberTreeViewWithRoots } from "./FiberTreeView";
import { DevtoolsContext, DevtoolsProvider } from "./context";

function getNewPort(): chrome.runtime.Port {
  if (__DEV__) {
    return devtoolsPortInDev();
  }
  return chrome.runtime.connect({ name: "panel" });
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
    <DevtoolsProvider>
      <Controls targetElementRef={ref} port={port} />
      <div ref={ref} className="App">
        {result && <FiberTreeViewWithRoots results={result} />}
      </div>
    </DevtoolsProvider>
  );
}

function Controls({ targetElementRef, port }) {
  let context = React.useContext(DevtoolsContext);
  if (!context) {
    throw new Error("<DevtoolsProvider /> missing");
  }
  let { settings, setScale, setTheme, setShowProps, setAutoCollapse } = context;

  function onRangeChange(e) {
    let newScale = e.target.value / 50;
    if (!targetElementRef.current) {
      return;
    }
    setScale(targetElementRef.current, newScale);
  }

  return (
    <div className="controls-form">
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
            Scan and refresh
          </button>
        </div>
      )}
      <span>
        <label htmlFor="range">Scale</label>
        <input
          id="range"
          defaultValue={settings.scale * 50}
          type="range"
          onChange={onRangeChange}
        />
      </span>
      <span>
        <input
          id="theme"
          type="checkbox"
          defaultChecked={settings.theme === "dark"}
          onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
        />
        <label htmlFor="theme">Dark mode</label>
      </span>
      <span>
        <input
          id="showprops"
          type="checkbox"
          defaultChecked={settings.showProps}
          onChange={(e) => setShowProps(e.target.checked)}
        />
        <label htmlFor="showprops">Show props</label>
      </span>
      <span>
        <input
          type="checkbox"
          id="autocollapse"
          defaultChecked={settings.autoCollapse}
          onChange={(e) => setAutoCollapse(e.target.checked)}
        />
        <label htmlFor="autocollapse">Smart collapse</label>
      </span>
    </div>
  );
}

export default App;
