import { DEVTOOLS_AGENT, DEVTOOLS_PANEL } from "../shared";

// page -> content-script (here) -> background
window.addEventListener("message", onMessageFromPage);

// background -> content-script (here) -> page
window.chrome.runtime.onMessage.addListener(onMessageFromBackground);

function onMessageFromPage(event: MessageEvent) {
  // page -> content-script (here) -> background
  // only allow messages from the same window and from the devtools agent
  // these messages are to be transferred to the background
  if (
    event.source === window &&
    event.data &&
    event.data.source === DEVTOOLS_AGENT
  ) {
    window.chrome.runtime.sendMessage(event.data);
  }
}

function onMessageFromBackground(message: any) {
  // background -> content-script (here) -> page
  // only allow messages from devtools
  // messages from devtools are re-posted on the page
  if (message.source === DEVTOOLS_PANEL) {
    window.postMessage(message, "*");
  }
}
