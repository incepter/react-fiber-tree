import {ParsingReturn} from "./bg/parser/_types";
import {DEVTOOLS_AGENT} from "./shared";

export type PageMessage = {
  type: "scan-result";
  data: ParsingReturn[];
  source: typeof DEVTOOLS_AGENT;
};

declare global {
  interface Window {
    __REACT_FIBER_TREE__: {
      scanAndSend(): void;
    };
    __REACT_DEVTOOLS_GLOBAL_HOOK__: {
      getFiberRoots(id: number): Set<any>;
    };
  }
}
