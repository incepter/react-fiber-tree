import { __DEV__, DEVTOOLS_AGENT, DEVTOOLS_PANEL } from "../shared";
import { scanAndSend } from "../bg/parser/parse";

let shimId = 0;

// to be able to use a development mode we shim the chrome port object in dev
// mode. The shim will expose the following methods:
// - postMessage(message) {} emulating chrome.runtime.Port.postMessage()
// - onMessage object with addListener and removeListener functions
// - onDisconnect to emulate the chrome.runtime.Port.onDisconnect function
export function devtoolsPortInDev(): chrome.runtime.Port {
  let onDisconnect: Function[] = [];
  let listeners: Function[] | null = [];
  let listener = spyOnMessagesFromCurrentPage.bind(null, () => listeners);

  (window as any).addEventListener("message", listener);
  return {
    listeners,
    id: ++shimId,
    postMessage(msg) {
      window.postMessage(msg);
    },
    // @ts-expect-error there are missing properties we aren't using
    onMessage: {
      addListener(fn) {
        listeners?.push(fn);
      },
      removeListener(fn) {
        if (!listeners) {
          return;
        }
        listeners = listeners.filter((t) => t !== fn);
      },
    },
    // @ts-expect-error there are missing properties we aren't using
    onDisconnect: {
      addListener(fn) {
        onDisconnect.push(fn);
        (window as any).addEventListener("message", listener);
      },
      removeListener(fn) {
        if (!onDisconnect) {
          return;
        }
        onDisconnect = onDisconnect.filter((t) => t !== fn);
      },
    },
  };
}

function spyOnMessagesFromCurrentPage(
  getListeners: () => Function[] | null,
  message: any
) {
  if (message.data?.source === DEVTOOLS_AGENT) {
    let toNotify = getListeners();
    toNotify?.forEach?.((fn) => fn(message.data));
  }
  if (__DEV__) {
    if (message.data?.source === DEVTOOLS_PANEL) {
      scanAndSend();
    }
  }
}
