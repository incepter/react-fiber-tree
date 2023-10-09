export let __DEV__ = process.env.NODE_ENV !== "production";

let libName = process.env.EXTENSION_LIB_NAME || "my-lib";

if (__DEV__) {
  // this will help avoid any storage or any other global thing mismatch
  libName = `dev-mode-${libName}`;
}

export let libDisplayName =
  process.env.EXTENSION_LIB_DISPLAY_NAME || ("My lib" as const);

// devtools panel is the devtools itself, a message source with devtools_panel
// means the devtools sent this message
export let DEVTOOLS_PANEL = `${libName}-panel` as const;

// devtools agent is the injected script in the real window
// a message with source as devtools_agent means the page sent it
export let DEVTOOLS_AGENT = `${libName}-agent` as const;

// in case the extension is using storage, use this
export let DEVTOOLS_STORAGE = `${libName}-storage-0.0.1` as const;

export function getTabId() {
  // since developing extensions is painful, and we should not wait until the
  // extension is installed to be able to perform some dev work, we shim the
  // chrome port in dev mode which allow developing and at the same time seeing
  // the extension output. This is quite helpful
  if (__DEV__) {
    return -1;
  }

  return chrome.devtools.inspectedWindow?.tabId;
}
