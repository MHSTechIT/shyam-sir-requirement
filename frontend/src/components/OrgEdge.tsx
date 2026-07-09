import { BaseEdge, getSmoothStepPath, Position, type EdgeProps } from "@xyflow/react";
import { useOrg } from "../store/orgStore";

/**
 * Org-chart connector: an orthogonal edge whose horizontal "bus" is shared by
 * every child of the same parent. All sibling edges bend at the SAME y (midway
 * between the parent's bottom and the topmost child), so a parent with multiple
 * children shows one clean shared distributor line with rounded corners — the
 * classic org-chart look — instead of separate, misaligned elbows.
 */
export function OrgEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  source,
  markerEnd,
  style,
}: EdgeProps) {
  // Shared bus y = midpoint between the parent's bottom and the highest child.
  const busY = useOrg((s) => {
    let topMostChild = Infinity;
    for (const c of s.connections) {
      if (c.view === s.currentView && c.from === source) {
        const n = s.nodes[c.to];
        if (n && n.y < topMostChild) topMostChild = n.y;
      }
    }
    const childTop = Number.isFinite(topMostChild) ? topMostChild : targetY;
    return (sourceY + childTop) / 2;
  });

  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Bottom,
    targetX,
    targetY,
    targetPosition: Position.Top,
    borderRadius: 16,
    centerY: busY,
  });

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
}
