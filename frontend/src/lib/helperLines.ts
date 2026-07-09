import type { Node, NodePositionChange, XYPosition } from "@xyflow/react";

// Ported from the official React Flow "Helper Lines" example.
// Given the position change for the dragged node, find the nearest alignment
// (within `distance` px) against every other node's left/right/center /
// top/bottom/middle edges, snap the dragged node to it, and return the guide
// line coordinates to draw.

export type HelperLinesResult = {
  horizontal?: number;
  vertical?: number;
  snapPosition: Partial<XYPosition>;
};

function bounds(pos: XYPosition, w: number, h: number) {
  return {
    left: pos.x,
    right: pos.x + w,
    top: pos.y,
    bottom: pos.y + h,
    width: w,
    height: h,
  };
}

export function getHelperLines(
  change: NodePositionChange,
  nodes: Node[],
  distance = 5
): HelperLinesResult {
  const defaultResult: HelperLinesResult = {
    horizontal: undefined,
    vertical: undefined,
    snapPosition: { x: undefined, y: undefined },
  };
  const nodeA = nodes.find((n) => n.id === change.id);
  if (!nodeA || !change.position) return defaultResult;

  const aw = nodeA.measured?.width ?? 0;
  const ah = nodeA.measured?.height ?? 0;
  const a = bounds(change.position, aw, ah);

  let horizontalDistance = distance;
  let verticalDistance = distance;

  return nodes
    .filter((n) => n.id !== nodeA.id)
    .reduce<HelperLinesResult>((result, nodeB) => {
      const bw = nodeB.measured?.width ?? 0;
      const bh = nodeB.measured?.height ?? 0;
      const b = bounds(nodeB.position, bw, bh);

      // --- vertical guides (align on X) ---
      const leftLeft = Math.abs(a.left - b.left);
      if (leftLeft < verticalDistance) {
        result.snapPosition.x = b.left;
        result.vertical = b.left;
        verticalDistance = leftLeft;
      }
      const rightRight = Math.abs(a.right - b.right);
      if (rightRight < verticalDistance) {
        result.snapPosition.x = b.right - a.width;
        result.vertical = b.right;
        verticalDistance = rightRight;
      }
      const leftRight = Math.abs(a.left - b.right);
      if (leftRight < verticalDistance) {
        result.snapPosition.x = b.right;
        result.vertical = b.right;
        verticalDistance = leftRight;
      }
      const rightLeft = Math.abs(a.right - b.left);
      if (rightLeft < verticalDistance) {
        result.snapPosition.x = b.left - a.width;
        result.vertical = b.left;
        verticalDistance = rightLeft;
      }
      const centerX = Math.abs(a.left + a.width / 2 - (b.left + b.width / 2));
      if (centerX < verticalDistance) {
        result.snapPosition.x = b.left + b.width / 2 - a.width / 2;
        result.vertical = b.left + b.width / 2;
        verticalDistance = centerX;
      }

      // --- horizontal guides (align on Y) ---
      const topTop = Math.abs(a.top - b.top);
      if (topTop < horizontalDistance) {
        result.snapPosition.y = b.top;
        result.horizontal = b.top;
        horizontalDistance = topTop;
      }
      const bottomBottom = Math.abs(a.bottom - b.bottom);
      if (bottomBottom < horizontalDistance) {
        result.snapPosition.y = b.bottom - a.height;
        result.horizontal = b.bottom;
        horizontalDistance = bottomBottom;
      }
      const bottomTop = Math.abs(a.bottom - b.top);
      if (bottomTop < horizontalDistance) {
        result.snapPosition.y = b.top - a.height;
        result.horizontal = b.top;
        horizontalDistance = bottomTop;
      }
      const topBottom = Math.abs(a.top - b.bottom);
      if (topBottom < horizontalDistance) {
        result.snapPosition.y = b.bottom;
        result.horizontal = b.bottom;
        horizontalDistance = topBottom;
      }
      const centerY = Math.abs(a.top + a.height / 2 - (b.top + b.height / 2));
      if (centerY < horizontalDistance) {
        result.snapPosition.y = b.top + b.height / 2 - a.height / 2;
        result.horizontal = b.top + b.height / 2;
        horizontalDistance = centerY;
      }

      return result;
    }, defaultResult);
}
