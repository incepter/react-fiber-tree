import { DEVTOOLS_PANEL } from "../shared";

chrome.runtime.onConnect.addListener(onDevtoolsConnect);

// content-script -> background (here) -> devtools
chrome.runtime.onMessage.addListener(onMessageFromContentScript);

function onMessageFromContentScript(
  message: any, // let everything be transferred to back
  sender: chrome.runtime.MessageSender
) {
  // port should be already registered when onConnect ticked
  // or else it s skipped
  const senderTabId = sender.tab?.id;

  if (senderTabId !== undefined) {
    const port = ports[senderTabId];
    if (port) {
      port.postMessage(message);
    }
  }

  return true;
}

let ports = {};

function registerNewTab(tabId: number, port: chrome.runtime.Port) {
  ports[tabId] = port;
}

function injectBackgroundScriptIntoCurrentPage() {
  chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(([tab]) => {
      const tabId = tab.id;
      if (tabId !== undefined) {
        chrome.scripting.executeScript({
          target: {
            tabId: tab.id!,
            allFrames: true,
          },
          files: ["bgScript.js"],
          injectImmediately: true,
          // @ts-expect-error ExecutionWorld isn't defined in types ?
          world: chrome.scripting.ExecutionWorld.MAIN,
        });
      }
    })
    .catch((e) => {
      console.error("Error injecting bgScript", e);
    });
}

function onDevtoolsConnect(port: chrome.runtime.Port) {
  let tabId: number;

  // devtools -> background (here) -> content-script
  port.onMessage.addListener(onMessageFromDevtools);
  port.onDisconnect.addListener(onDevtoolsDisconnect);

  function onDevtoolsDisconnect() {
    delete ports[tabId];
  }

  // this is executed when a message is received from the devtools
  function onMessageFromDevtools(message: {
    tabId: number;
    source: string;
    type: "scan" | "init";
  }) {
    // messages from anything different from the devtools will be dropped
    if (message.source !== DEVTOOLS_PANEL) {
      return;
    }

    let { tabId, type } = message;
    let existingPort: chrome.runtime.Port | undefined = ports[tabId];

    // this means that the port was disconnected but still we received this
    // message. since we have a reference to the port, we will either
    // re-attach it or drop the message.
    // first we will attach it back, and then run the execution inside a try
    // catch to remove it.
    if (!existingPort) {
      existingPort = port;
      ports[tabId] = port;
      registerNewTab(tabId, port);
      injectBackgroundScriptIntoCurrentPage();
    } else if (existingPort !== port) {
      // this means that we registered another port with the same tab
      // I don't know how this can happen, but let's keep this code path here
      // even if it does nothing at some point. Just to highlight this path.
    }

    switch (type) {
      case "init": {
        // remove the previous port from the list of current ports
        if (existingPort && existingPort !== port) {
          delete ports[tabId];
        }
        // inject a new port
        registerNewTab(tabId, port);
        injectBackgroundScriptIntoCurrentPage();
        // transfer the message to content-script
        chrome.tabs.sendMessage(tabId, message);
        break;
      }
      case "scan":
      default: {
        // transfer the message to content-script
        chrome.tabs.sendMessage(tabId, message);
        break;
      }
    }
  }
}
