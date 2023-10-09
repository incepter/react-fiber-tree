import { useDevtoolsContext } from "../context";
import * as React from "react";
import { __DEV__, DEVTOOLS_PANEL, getTabId } from "../../shared";

export type ControlsProps = {
  port: chrome.runtime.Port | null;
  targetElementRef: React.MutableRefObject<HTMLDivElement | null>;
};

export function Controls({ targetElementRef, port }: ControlsProps) {
  let context = useDevtoolsContext();
  let { settings, setScale, setTheme, setShowProps, setAutoCollapse } = context;

  function onRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    let newScale = +e.target.value / 50;
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
                type: "scan",
                tabId: getTabId(),
                source: __DEV__ ? DEVTOOLS_PANEL : DEVTOOLS_PANEL,
              })
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
