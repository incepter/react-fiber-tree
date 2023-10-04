import * as React from "react";
import { ParsedNode, ReactFiberRoot } from "./_types.ts";
import { parseNode, setupRoot } from "./parse.ts";
import "./style.css";
import { getVariantClassName } from "./utils.ts";

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: {
      getFiberRoots(id: number): Set<ReactFiberRoot>;
    };
  }
}

export function FiberTreeViewWithRoots({ initialIndex = 0 }) {
  const [rootIndex, setRootIndex] = React.useState(initialIndex);
  const rootsList = [...window.__REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(1)];

  const fiberRootAtIndex = rootsList[rootIndex];

  return (
    <div className="with-roots-container">
      <div>
        {rootsList.map((root, id) => (
          <button
            key={id}
            onClick={() => setRootIndex(id)}
            className={root === fiberRootAtIndex ? "current-root" : ""}
          >
            {`id=${root.containerInfo.id}`}
          </button>
        ))}
      </div>
      {fiberRootAtIndex && <FiberRootTreeView fiberRoot={fiberRootAtIndex} />}
    </div>
  );
}
type FiberRootTreeViewProps = {
  fiberRoot: ReactFiberRoot;
};

export function FiberRootTreeView({ fiberRoot }: FiberRootTreeViewProps) {
  const root = fiberRoot.current;
  const parsedTree = parseNode(root);
  const [, rerender] = React.useState(0);

  React.useLayoutEffect(setupRoot.bind(null, root, rerender), [root, rerender]);

  return <NodeView node={parsedTree} />;
}

export type NodeViewProps = {
  node: ParsedNode;
  variant?: "root" | "child" | "sibling";
};

function NodeView({ node, variant = "root" }: NodeViewProps) {
  if (!node) {
    return null;
  }

  const { child, sibling, tag, props, type } = node;

  const variantClx = getVariantClassName(variant);
  const isHostThing = tag.startsWith("Host") && tag !== "HostRoot";

  const hasChild = !!child;
  const hasSibling = !!sibling;

  const separatorWidth = hasSibling ? 258 * (sibling.offset || 0) + 40 : 40;

  const containerClx = `${variantClx} ${hasSibling ? "el-has-sibling" : ""}`;
  const mainClx = `${hasChild ? "el-has-child" : ""} ${
    hasSibling ? "el-has-sibling" : ""
  }`;

  return (
    <div className={containerClx}>
      <div className={mainClx}>
        <div className={`el ${isHostThing ? "el-host" : ""}`}>
          <span>
            {tag}
            {type && <span>{` (${String(type)})`}</span>}
          </span>

          {props &&
            Object.entries(props).map(([prop, value]) => (
              <li key={prop}>{`${prop}: ${String(value)}`}</li>
            ))}
        </div>
        {hasChild && <NodeView variant="child" node={child} />}
      </div>
      {hasSibling && (
        <>
          <div
            style={{ width: separatorWidth }}
            className="el-sibling-separator"
          ></div>
          <NodeView variant="sibling" node={sibling} />
        </>
      )}
    </div>
  );
}
