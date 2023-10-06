import * as React from "react";
import { ParsedNode, ParsingReturn } from "../parser/_types";
import "./style.css";
import { getVariantClassName, humanizeTag } from "../parser/utils";
import { DevtoolsContext } from "./context";

type FiberRootTreeViewProps = {
  initialIndex?: number;
  results: ParsingReturn[];
};

export function FiberTreeViewWithRoots({
  initialIndex = 0,
  results,
}: FiberRootTreeViewProps) {
  let context = React.useContext(DevtoolsContext);
  if (!context) {
    throw new Error("<DevtoolsProvider /> missing");
  }
  const [currentIndex, setCurrentIndex] = React.useState<number>(initialIndex);

  let {
    settings: { showProps, autoCollapse },
  } = context;

  const current = results[currentIndex];
  return (
    <div className="with-roots-container">
      <div>
        {results.map((result: ParsingReturn, index: number) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`root-btn ${
              result[1] === current[1] ? "current-root" : ""
            }`}
          >
            <span>{`id=${result[1]}`}</span>
            <span>{`${result[0]} total nodes`}</span>
          </button>
        ))}
      </div>
      {current && (
        <NodeView
          node={current[2]}
          showProps={showProps}
          autoCollapse={autoCollapse}
        />
      )}
    </div>
  );
}

export type NodeViewProps = {
  node: ParsedNode;
  showCollapsedChildren?: number;
  showCollapsedSibling?: number;
  variant?: "root" | "child" | "sibling";

  autoCollapse: boolean;
  showProps: boolean;
};

function NodeView({
  node,
  variant = "root",
  showCollapsedChildren,
  showCollapsedSibling,
  showProps,
  autoCollapse,
}: NodeViewProps) {
  if (!node) {
    return null;
  }

  const [numberTag, type, props, _offset, child, sibling] = node;

  const tag = humanizeTag(numberTag);

  const variantClx = getVariantClassName(variant);
  const isHostThing = tag.startsWith("Host") && tag !== "HostRoot";

  const containerClx = `${variantClx} ${sibling ? "w-sibling" : ""}`;
  const mainClx = `${sibling ? "w-child" : ""} ${sibling ? "w-sibling" : ""}`;

  let elementTitle = `${String(type)}\n(${tag})`;

  return (
    <div className={containerClx}>
      <div className={mainClx}>
        <div className={`el ${isHostThing ? "el-host" : ""}`}>
          <span title={elementTitle}>
            {type && type !== "null" && (
              <span className="el-type">{String(type)}</span>
            )}
            <span className="el-tag">{tag}</span>
          </span>
          {showProps && <NodeProps props={props} />}
        </div>
        {child && (
          <ChildNode
            child={child}
            showProps={showProps}
            autoCollapse={autoCollapse}
            showCollapsedSibling={showCollapsedSibling}
            showCollapsedChildren={showCollapsedChildren}
          />
        )}
        {sibling && <div className="el-sibling-separator"></div>}
      </div>
      {sibling && (
        <SiblingNode
          sibling={sibling}
          showProps={showProps}
          autoCollapse={autoCollapse}
          showCollapsedSibling={showCollapsedSibling}
          showCollapsedChildren={showCollapsedChildren}
        />
      )}
    </div>
  );
}

function ChildNode({
  child,
  showProps,
  autoCollapse,
  showCollapsedChildren,
  showCollapsedSibling,
}) {
  let childrenInfo = getChildrenInfo(child);
  let [showingCollapsed, setShowingCollapsed] = React.useState(
    !!showCollapsedChildren
  );
  let collapseChildTree =
    autoCollapse &&
    (childrenInfo.firstWithSibling > 2 ||
      (childrenInfo.firstWithSibling === 0 && childrenInfo.count > 2));
  let showChildrenTree = !collapseChildTree || showingCollapsed;

  let nextChild = child;
  // jump to next child when collapsing the tree
  if (!showChildrenTree) {
    if (childrenInfo.nextChild) {
      nextChild = childrenInfo.nextChild;
    } else {
      nextChild = null;
    }
  }

  return (
    <>
      {nextChild && showChildrenTree && (
        <NodeView
          variant="child"
          node={nextChild}
          showProps={showProps}
          autoCollapse={autoCollapse}
          showCollapsedChildren={
            showCollapsedChildren === undefined
              ? Math.max(childrenInfo.firstWithSibling, childrenInfo.count)
              : showCollapsedChildren > 2
              ? showCollapsedChildren - 1
              : undefined
          }
          showCollapsedSibling={showCollapsedSibling}
        />
      )}
      {child && !showChildrenTree && (
        <>
          <div
            onClick={() => {
              setShowingCollapsed(true);
            }}
            className="collapsed el-child"
          >
            {`Click to view ${
              childrenInfo.firstWithSibling
                ? childrenInfo.firstWithSibling
                : childrenInfo.count
            } items`}
          </div>
          <NodeView
            variant="child"
            node={nextChild!}
            showProps={showProps}
            autoCollapse={autoCollapse}
            showCollapsedSibling={showCollapsedSibling}
            showCollapsedChildren={showCollapsedChildren}
          />
        </>
      )}
    </>
  );
}

function getChildrenInfo(firstChild: ParsedNode | null) {
  if (!firstChild) {
    return { count: 0, firstWithSibling: 0 };
  }
  let count = 0;
  let firstWithSibling = 0;
  let nextChild: ParsedNode | null = null;
  let current: ParsedNode | null = firstChild;
  while (current !== null) {
    count += 1;

    let sibling = current[5];
    if (!firstWithSibling && sibling) {
      nextChild = current;
      firstWithSibling = count;
    }

    current = current[4];
  }

  return { count, firstWithSibling, nextChild };
}

function SiblingNode({
  sibling,
  showProps,
  autoCollapse,
  showCollapsedSibling,
  showCollapsedChildren,
}) {
  let siblingInfo = getSiblingInfo(sibling);
  let [showingCollapsed, setShowingCollapsed] = React.useState(
    !!showCollapsedSibling
  );
  let collapseSiblingTree =
    autoCollapse &&
    (siblingInfo.firstWithChild > 2 ||
      (siblingInfo.firstWithChild === 0 && siblingInfo.count > 2));

  let showSiblingTree =
    !collapseSiblingTree || showingCollapsed || (showCollapsedSibling || 0) > 0;

  let nextSibling = sibling;
  // jump to next child when collapsing the tree
  if (!showSiblingTree) {
    if (siblingInfo.nextSibling) {
      nextSibling = siblingInfo.nextSibling;
    } else {
      nextSibling = null;
    }
  }

  return (
    <>
      {nextSibling && showSiblingTree && (
        <NodeView
          variant="sibling"
          node={nextSibling}
          showProps={showProps}
          autoCollapse={autoCollapse}
          showCollapsedSibling={
            showCollapsedSibling === undefined
              ? Math.max(siblingInfo.firstWithChild, siblingInfo.count)
              : showCollapsedSibling > 2
              ? showCollapsedSibling - 1
              : undefined
          }
          showCollapsedChildren={showCollapsedChildren}
        />
      )}
      {sibling && !showSiblingTree && (
        <>
          <div style={{ position: "relative" }}>
            <div
              onClick={() => {
                setShowingCollapsed(true);
              }}
              className="collapsed el-sibling"
            >
              {`Click to view ${
                siblingInfo.firstWithChild
                  ? siblingInfo.firstWithChild - 1
                  : siblingInfo.count
              } items`}
            </div>
            <div className="el-sibling-small-separator"></div>
          </div>
          {nextSibling && (
            <NodeView
              variant="sibling"
              node={nextSibling}
              showProps={showProps}
              autoCollapse={autoCollapse}
              showCollapsedSibling={
                showCollapsedSibling === undefined
                  ? Math.max(siblingInfo.firstWithChild, siblingInfo.count)
                  : showCollapsedSibling > 2
                  ? showCollapsedSibling - 1
                  : undefined
              }
              showCollapsedChildren={showCollapsedChildren}
            />
          )}
        </>
      )}
    </>
  );
}

function getSiblingInfo(firstSibling: ParsedNode | null) {
  if (!firstSibling) {
    return { count: 0, firstWithChild: 0 };
  }
  let count = 0;
  let firstWithChild = 0;
  let nextSibling: ParsedNode | null = null;
  let current: ParsedNode | null = firstSibling;
  while (current !== null) {
    count += 1;

    let child = current[4];
    if (!firstWithChild && child) {
      nextSibling = current;
      firstWithChild = count;
    }

    current = current[5];
  }

  return { count, firstWithChild, nextSibling };
}

function safeString(src: any) {
  try {
    return String(src);
  } catch (e) {
    return "--parsing-error";
  }
}

function propDisplay(prop, value) {
  return `${prop !== "" ? `${prop}: ` : ""}${safeString(value).substring(
    0,
    20
  )}`;
}

function NodeProps({ props }) {
  let propsEntries = props && Object.entries(props);
  let slicedProps = propsEntries && propsEntries.slice(0, 2);
  let propsTitle =
    propsEntries &&
    propsEntries.map((t) => `${t[0]}: ${safeString(t[1])}`).join("\n");
  if (
    slicedProps &&
    propsEntries &&
    slicedProps.length !== propsEntries.length
  ) {
    slicedProps.push([
      "",
      `(${propsEntries.length - slicedProps.length} remaining items)`,
    ]);
  }

  return (
    <div title={propsTitle} className="el-props">
      {slicedProps &&
        slicedProps.map(([prop, value]) => (
          <li key={prop}>{propDisplay(prop, value)}</li>
        ))}
    </div>
  );
}
