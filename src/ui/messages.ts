import { __DEV__, DEVTOOLS_PANEL, getTabId } from "../shared";

export type DevtoolsMessageType = "init" | "scan";

export function sendFromDevtools_ToBackground(
  port: chrome.runtime.Port,
  type: DevtoolsMessageType,
  data: any
) {
  if (!port) {
    return;
  }

  port!.postMessage({
    type,
    data,
    tabId: getTabId(),
    source: DEVTOOLS_PANEL,
  });
}
