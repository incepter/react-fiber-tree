import { scanAndSend } from "./parse";
import { DEVTOOLS_PANEL } from "../../shared";

// this file will be injected into the main page.
// the goal is to attach a scanAndSend() function to the current window
// Also, we will be spying/waiting for the scan or init events
if (!window.__REACT_FIBER_TREE__) {
  window.__REACT_FIBER_TREE__ = {
    scanAndSend,
  };

  window.addEventListener("message", onMessageFromContentScript);
}

let didLogMessagesReceiving = false;
function onMessageFromContentScript(message: MessageEvent) {
  if (!didLogMessagesReceiving) {
    didLogMessagesReceiving = true;
    console.log("The injected backend listener started receiving messages");
  }

  // only allow the devtools panel to communicate with this listener
  if (message?.data?.source !== DEVTOOLS_PANEL) {
    return;
  }

  const messageType = message.data.type;
  switch (messageType) {
    // both init and scan events will scan the fiber tree
    case "scan":
    case "init": {
      window.__REACT_FIBER_TREE__.scanAndSend();
      return;
    }
  }
}
