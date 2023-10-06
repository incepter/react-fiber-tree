import * as React from "react";
import { DEVTOOLS_STORAGE } from "../shared";

export type DevtoolsContextType = {
  settings: DevtoolsSettings;
  setTheme(theme: "dark" | "light" | "system"): void;
  setScale(target: HTMLDivElement, scale: number): void;

  setShowProps(value: boolean): void;
  setAutoCollapse(value: boolean): void;
};

export const DevtoolsContext = React.createContext<DevtoolsContextType | null>(
  null
);

export type DevtoolsSettings = {
  scale: number;
  showProps: boolean;
  autoCollapse: boolean;
  theme: "dark" | "light" | "system";
};

export function DevtoolsProvider(props: { children: React.ReactNode }) {
  let [settings, setSettings] = React.useState(loadSavedSettings);

  const contextValue = React.useMemo<DevtoolsContextType>(
    () => ({
      settings,
      setScale(target: HTMLDivElement, scale: number) {
        let currentSettings = loadSavedSettings();
        currentSettings.scale = scale;
        target.style.scale = "" + scale;
        saveSettings(currentSettings);
        setSettings(currentSettings);
      },
      setTheme(theme: "dark" | "light" | "system") {
        let currentSettings = loadSavedSettings();
        currentSettings.theme = theme;

        applyTheme(theme);
        saveSettings(currentSettings);
        setSettings(currentSettings);
      },
      setShowProps(showProps: boolean) {
        let currentSettings = loadSavedSettings();
        currentSettings.showProps = showProps;

        saveSettings(currentSettings);
        setSettings(currentSettings);
      },
      setAutoCollapse(autoCollapse: boolean) {
        let currentSettings = loadSavedSettings();
        currentSettings.autoCollapse = autoCollapse;

        saveSettings(currentSettings);
        setSettings(currentSettings);
      },
    }),
    [settings]
  );

  React.useLayoutEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  return (
    <DevtoolsContext.Provider value={contextValue}>
      {props.children}
    </DevtoolsContext.Provider>
  );
}

function applyTheme(theme) {
  let documentElement = document.body;

  if (theme === "system") {
    documentElement.classList.remove("theme-dark");
    documentElement.classList.remove("theme-light");
  }

  if (theme === "dark") {
    documentElement.classList.add("theme-dark");
    documentElement.classList.remove("theme-light");
  }

  if (theme === "light") {
    documentElement.classList.add("theme-light");
    documentElement.classList.remove("theme-dark");
  }
}

function loadSavedSettings(): DevtoolsSettings {
  let savedStorage = localStorage.getItem(DEVTOOLS_STORAGE);

  if (savedStorage) {
    return JSON.parse(savedStorage) as DevtoolsSettings;
  }

  return {
    scale: 1,
    theme: "dark",
    showProps: false,
    autoCollapse: true,
  };
}

function saveSettings(s: DevtoolsSettings) {
  localStorage.setItem(DEVTOOLS_STORAGE, JSON.stringify(s));
}
