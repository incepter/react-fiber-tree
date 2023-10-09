import * as React from "react";
import { ParsedNode, ParsingReturn } from "../../bg/parser/_types";
import "../style.css";
import { getVariantClassName, humanizeTag } from "../../bg/parser/utils";
import { useDevtoolsContext } from "../context";

type FiberRootTreeViewProps = {
  initialIndex?: number;
  results: ParsingReturn[];
};

export function FiberTreeViewWithRoots({
  results,
  initialIndex = 0,
}: FiberRootTreeViewProps) {
  const { settings } = useDevtoolsContext();
  let { showProps, autoCollapse } = settings;

  const [currentIndex, setCurrentIndex] = React.useState<number>(initialIndex);

  // current is the currently displayed root with its structure
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

interface NodeViewPropsBase {
  showProps: boolean;
  autoCollapse: boolean;
  showCollapsedChildren?: number;
  showCollapsedSibling?: number;
  variant?: "root" | "child" | "sibling";
}

interface NodeViewProps extends NodeViewPropsBase {
  node: ParsedNode;
}

function NodeView({
  node,
  showProps,
  autoCollapse,
  variant = "root",
  showCollapsedChildren,
  showCollapsedSibling,
}: NodeViewProps) {
  if (!node) {
    return null;
  }

  const [numberTag, type, props, child, sibling] = node;

  const tag = humanizeTag(numberTag);
  const elementTitle = `${String(type)}\n(${tag})`;
  const variantClx = getVariantClassName(variant);
  const isHostThing = tag.startsWith("Host") && tag !== "HostRoot";
  const containerClx = `${variantClx} ${sibling ? "w-sibling" : ""}`;
  const mainClx = `${sibling ? "w-child" : ""} ${sibling ? "w-sibling" : ""}`;

  const ChildComponent = autoCollapse ? CollapsibleChild : DefaultChild;
  const SiblingComponent = autoCollapse ? CollapsibleSibling : DefaultSibling;

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
          <ChildComponent
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
        <SiblingComponent
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

function DefaultChild({
  child,
  showProps,
  autoCollapse,
  showCollapsedChildren: showChild,
  showCollapsedSibling: showSibling,
}: NodeViewPropsBase & { child: ParsedNode }) {
  return (
    <NodeView
      node={child}
      variant="child"
      showProps={showProps}
      autoCollapse={autoCollapse}
      showCollapsedChildren={showChild}
      showCollapsedSibling={showSibling}
    />
  );
}
function DefaultSibling({
  sibling,
  showProps,
  autoCollapse,
  showCollapsedChildren: showChild,
  showCollapsedSibling: showSibling,
}: NodeViewPropsBase & { sibling: ParsedNode }) {
  return (
    <NodeView
      node={sibling}
      variant="sibling"
      showProps={showProps}
      autoCollapse={autoCollapse}
      showCollapsedChildren={showChild}
      showCollapsedSibling={showSibling}
    />
  );
}

function CollapsibleChild({
  child,
  showProps,
  autoCollapse,
  showCollapsedChildren: showChild,
  showCollapsedSibling: showSibling,
}: NodeViewPropsBase & { child: ParsedNode }) {
  if (!autoCollapse) {
    throw new Error("Called CollapsibleChild with autoCollapse false");
  }

  let [showingCollapsed, setShowingCollapsed] = React.useState(!!showChild);

  let childrenInfo = getChildrenInfo(child);
  let collapseChildTree = childrenInfo.count > 2;
  let showTree = !collapseChildTree || showingCollapsed;

  let nextChild: ParsedNode | null = child;
  let nextShowCollapsedChildrenProp = showChild;
  // jump to next child when collapsing the tree
  if (!showTree) {
    if (childrenInfo.nextChild) {
      nextChild = childrenInfo.nextChild;
    } else {
      nextChild = null;
    }
  }
  if (nextChild && showTree) {
    // when showChild isn't provided, then take childrenInfo.count
    // this will start the cycle.
    // and reset to undefined too to avoid passing 0
    nextShowCollapsedChildrenProp =
      showChild === undefined
        ? childrenInfo.count
        : showChild > 2
        ? showChild - 1
        : undefined;
  }

  return (
    <>
      {nextChild && showTree && (
        <NodeView
          variant="child"
          node={nextChild}
          showProps={showProps}
          autoCollapse={autoCollapse}
          showCollapsedSibling={showSibling}
          showCollapsedChildren={nextShowCollapsedChildrenProp}
        />
      )}
      {child &&
        !showTree && [
          <div
            key="child-separator"
            className="collapsed el-child"
            onClick={() => setShowingCollapsed(true)}
          >
            {`Click to view ${childrenInfo.count} items`}
          </div>,
          <NodeView
            key="child"
            variant="child"
            node={nextChild!}
            showProps={showProps}
            autoCollapse={autoCollapse}
            showCollapsedChildren={showChild}
            showCollapsedSibling={showSibling}
          />,
        ]}
    </>
  );
}

function getChildrenInfo(firstChild: ParsedNode | null) {
  if (!firstChild) {
    return { count: 0 };
  }
  let count = 0;
  let current: ParsedNode | null = firstChild;
  while (current !== null) {
    count += 1;

    let sibling = current[4];
    if (sibling) {
      // no need to continue, just stop at the first child with a sibling
      // we will then decide whether to show or collapse what's between them
      return { count, nextChild: current };
    }

    current = current[3];
  }

  return { count, nextChild: null };
}

function CollapsibleSibling({
  sibling,
  showProps,
  autoCollapse,
  showCollapsedChildren: showChild,
  showCollapsedSibling: showSibling,
}: NodeViewPropsBase & { sibling: ParsedNode }) {
  if (!autoCollapse) {
    throw new Error("Called CollapsibleSibling with autoCollapse false");
  }

  let siblingInfo = getSiblingInfo(sibling);
  let [showingCollapsed, setShowingCollapsed] = React.useState(!!showSibling);

  let collapseTree = siblingInfo.count > 2;
  let showSiblingTree = !collapseTree || showingCollapsed;

  let nextSibling: ParsedNode | null = sibling;
  // jump to next child when collapsing the tree
  if (!showSiblingTree) {
    if (siblingInfo.nextSibling) {
      nextSibling = siblingInfo.nextSibling;
    } else {
      nextSibling = null;
    }
  }
  let nextShowCollapsedSiblingProp =
    showSibling === undefined
      ? siblingInfo.count
      : showSibling > 2
      ? showSibling - 1
      : undefined;

  return (
    <>
      {nextSibling && showSiblingTree && (
        <NodeView
          variant="sibling"
          node={nextSibling}
          showProps={showProps}
          autoCollapse={autoCollapse}
          showCollapsedChildren={showChild}
          showCollapsedSibling={nextShowCollapsedSiblingProp}
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
              {`Click to view ${siblingInfo.count} items`}
            </div>
            <div className="el-sibling-small-separator"></div>
          </div>
          {nextSibling && (
            <NodeView
              variant="sibling"
              node={nextSibling}
              showProps={showProps}
              autoCollapse={autoCollapse}
              showCollapsedChildren={showChild}
              showCollapsedSibling={nextShowCollapsedSiblingProp}
            />
          )}
        </>
      )}
    </>
  );
}

function getSiblingInfo(firstSibling: ParsedNode | null) {
  if (!firstSibling) {
    return { count: 0 };
  }
  let count = 0;
  let current: ParsedNode | null = firstSibling;
  while (current !== null) {
    count += 1;

    let child = current[3];
    if (child) {
      // no need to continue, just stop at the first sibling with a child
      // we will then decide whether to show or collapse what's between them
      return { count, nextSibling: current };
    }

    current = current[4];
  }

  return { count, nextSibling: null };
}

function safeString(src: any) {
  try {
    return String(src);
  } catch (e) {
    return "--parsing-error";
  }
}

function propDisplay(prop: string, value: any) {
  return `${prop !== "" ? `${prop}: ` : ""}${safeString(value).substring(
    0,
    20
  )}`;
}

function NodeProps({ props }) {
  let propsEntries = props && Object.entries(props);

  // only display two props
  let slicedProps = propsEntries && propsEntries.slice(0, 2);

  // the title will show all props
  let propsTitle =
    propsEntries &&
    propsEntries
      .map((t: [string, any]) => `${t[0]}: ${safeString(t[1])}`)
      .join("\n");

  // when slicing, we display another prop with the collapsed elements count
  // that will expand the tree to see collapsed items
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
