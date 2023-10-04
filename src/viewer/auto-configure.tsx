import { createRoot } from "react-dom/client";
import { FiberTreeViewWithRoots } from "./index.tsx";

export function autoConfigure() {
  const container = document.createElement("div");
  const separator = document.createElement("hr");

  container.id = "root_" + String(Date.now());

  const body = document.body;
  body.appendChild(separator);
  body.appendChild(container);

  const root = createRoot(container);

  root.render(<FiberTreeViewWithRoots />);
}
