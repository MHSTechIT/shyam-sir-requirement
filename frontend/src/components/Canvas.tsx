import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
  MarkerType,
  SelectionMode,
  type Connection as RFConnection,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeChange,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import { Maximize2, Minimize2 } from "lucide-react";
import { toggleFullscreen } from "../lib/fullscreen";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { OrgNode, type OrgNodeData } from "./OrgNode";
import { HelperLines } from "./HelperLines";
import { getHelperLines } from "../lib/helperLines";
import { isNodeVisible } from "../lib/selectors";
import { NODE_W } from "../lib/constants";
import type { LineStyle } from "../types";

const EDGE_TYPE: Record<LineStyle, string> = {
  curved: "default",
  straight: "straight",
  orthogonal: "smoothstep",
};

const INFO: Record<string, string> = {
  master:
    "Drag nodes to reposition · drag a node's bottom dot to another to connect · Select mode (toolbar) for box-select · Ctrl+C/V copy·paste · Ctrl+D duplicate · Del to remove · scroll to zoom",
  wc: "Wellness Center — set a node's view to “wc” to show it here",
  vsl: "VSL Project — Video Sales Letter team",
  col: "Collaboration Project — Partnership team",
};

export function Canvas() {
  const nodes = useOrg((s) => s.nodes);
  const connections = useOrg((s) => s.connections);
  const filters = useOrg((s) => s.filters);
  const currentView = useOrg((s) => s.currentView);
  const lineStyle = useOrg((s) => s.lineStyle);
  const addConnection = useOrg((s) => s.addConnection);
  const persistPositions = useOrg((s) => s.persistPositions);
  const deleteConnection = useOrg((s) => s.deleteConnection);
  const deleteNodes = useOrg((s) => s.deleteNodes);
  const copyNodes = useOrg((s) => s.copyNodes);
  const pasteClipboard = useOrg((s) => s.pasteClipboard);
  const duplicateNodes = useOrg((s) => s.duplicateNodes);
  const selectNode = useOrg((s) => s.selectNode);
  const openSidePanel = useUi((s) => s.openSidePanel);
  const showConfirm = useUi((s) => s.showConfirm);
  const fullscreen = useUi((s) => s.fullscreen);
  const canvasMode = useUi((s) => s.canvasMode);
  const rf = useReactFlow();

  const nodeTypes = useMemo(() => ({ org: OrgNode }), []);

  const [rfNodes, setRfNodes, onNodesChangeBase] = useNodesState<RFNode<OrgNodeData>>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<RFEdge>([]);
  const [helperV, setHelperV] = useState<number | undefined>(undefined);
  const [helperH, setHelperH] = useState<number | undefined>(undefined);

  // Rebuild visible nodes whenever structure / view / filters change.
  useEffect(() => {
    const built: RFNode<OrgNodeData>[] = [];
    for (const n of Object.values(nodes)) {
      if (!isNodeVisible(n, currentView, filters, nodes, connections)) continue;
      built.push({
        id: n.id,
        type: "org",
        position: { x: n.x, y: n.y },
        data: { nodeId: n.id },
        style: n.size
          ? { width: n.size.w, height: n.size.h }
          : { width: NODE_W },
      });
    }
    setRfNodes(built);
  }, [nodes, connections, filters, currentView, setRfNodes]);

  // Rebuild edges whenever connections / style change.
  useEffect(() => {
    const built: RFEdge[] = [];
    for (const c of connections) {
      if (c.view !== currentView) continue;
      const from = nodes[c.from];
      const to = nodes[c.to];
      if (!from || !to) continue;
      if (!isNodeVisible(from, currentView, filters, nodes, connections)) continue;
      if (!isNodeVisible(to, currentView, filters, nodes, connections)) continue;
      const style = (c.lineStyle as LineStyle) || lineStyle;
      built.push({
        id: c.id,
        source: c.from,
        target: c.to,
        type: EDGE_TYPE[style] || "default",
        style: { stroke: from.color, strokeOpacity: 0.7, strokeWidth: 1.8 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: from.color,
        },
      });
    }
    setRfEdges(built);
  }, [connections, nodes, filters, currentView, lineStyle, setRfEdges]);

  // Custom node-change handler: while dragging a single node, snap it to the
  // nearest neighbour edge/center and surface the alignment guide lines.
  const onNodesChange = useCallback(
    (changes: NodeChange<RFNode<OrgNodeData>>[]) => {
      setHelperV(undefined);
      setHelperH(undefined);
      const c = changes[0];
      if (
        changes.length === 1 &&
        c.type === "position" &&
        c.dragging &&
        c.position
      ) {
        const lines = getHelperLines(c, rfNodes);
        c.position.x = lines.snapPosition.x ?? c.position.x;
        c.position.y = lines.snapPosition.y ?? c.position.y;
        setHelperV(lines.vertical);
        setHelperH(lines.horizontal);
      }
      onNodesChangeBase(changes);
    },
    [rfNodes, onNodesChangeBase]
  );

  const onConnect = useCallback(
    (c: RFConnection) => {
      if (c.source && c.target) addConnection(c.source, c.target);
    },
    [addConnection]
  );

  const onNodeDragStop = useCallback(
    (_e: MouseEvent | TouchEvent, node: RFNode, dragged: RFNode[]) => {
      setHelperV(undefined);
      setHelperH(undefined);
      const list = dragged && dragged.length ? dragged : [node];
      persistPositions(
        list.map((n) => ({ id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) }))
      );
    },
    [persistPositions]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => selectNode(node.id),
    [selectNode]
  );
  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_e, node) => openSidePanel(node.id),
    [openSidePanel]
  );
  const onEdgeClick: EdgeMouseHandler = useCallback(
    (_e, edge) => {
      const conn = connections.find((c) => c.id === edge.id);
      if (!conn) return;
      const from = nodes[conn.from]?.title ?? conn.from;
      const to = nodes[conn.to]?.title ?? conn.to;
      showConfirm({
        icon: "🔗",
        title: "Delete connection?",
        msg: `Remove link "${from}" → "${to}"?`,
        primary: "Delete",
        danger: true,
        onYes: () => deleteConnection(edge.id),
      });
    },
    [connections, nodes, showConfirm, deleteConnection]
  );

  // React Flow calls this when the user presses the delete key with nodes selected.
  const onNodesDelete = useCallback(
    (deleted: RFNode[]) => {
      if (deleted.length) deleteNodes(deleted.map((n) => n.id));
    },
    [deleteNodes]
  );

  // Keyboard: copy / paste / duplicate operate on React Flow's own selection.
  const rfRef = useRef(rf);
  rfRef.current = rf;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable))
        return;
      const key = e.key.toLowerCase();
      if (key !== "c" && key !== "v" && key !== "d") return;
      const selected = rfRef.current.getNodes().filter((n) => n.selected).map((n) => n.id);
      if (key === "c") {
        if (selected.length) copyNodes(selected);
      } else if (key === "v") {
        e.preventDefault();
        pasteClipboard();
      } else if (key === "d") {
        if (selected.length) {
          e.preventDefault();
          duplicateNodes(selected);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyNodes, pasteClipboard, duplicateNodes]);

  const selectMode = canvasMode === "select";

  return (
    <div className="flow-wrap">
      <div className="info-bar">
        <span dangerouslySetInnerHTML={{ __html: INFO[currentView] || "" }} />
      </div>
      <div style={{ position: "absolute", top: 34, left: 0, right: 0, bottom: 0 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeClick={onEdgeClick}
          onNodesDelete={onNodesDelete}
          onPaneClick={() => selectNode(null)}
          deleteKeyCode={["Delete", "Backspace"]}
          selectionOnDrag={selectMode}
          panOnDrag={selectMode ? [1, 2] : true}
          selectionMode={SelectionMode.Partial}
          minZoom={0.2}
          maxZoom={2.5}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(124,58,237,0.22)" />
          <Controls>
            <ControlButton
              onClick={toggleFullscreen}
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </ControlButton>
          </Controls>
          <MiniMap
            nodeColor={(n) => nodes[n.id]?.color || "#7c3aed"}
            maskColor="rgba(237,234,254,0.7)"
            style={{ background: "#faf8ff", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 10 }}
          />
          <HelperLines horizontal={helperH} vertical={helperV} />
        </ReactFlow>
      </div>
    </div>
  );
}
