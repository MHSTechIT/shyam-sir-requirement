import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ControlButton,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection as RFConnection,
  type Node as RFNode,
  type Edge as RFEdge,
  type NodeMouseHandler,
  type EdgeMouseHandler,
} from "@xyflow/react";
import { Maximize2, Minimize2 } from "lucide-react";
import { toggleFullscreen } from "../lib/fullscreen";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { OrgNode, type OrgNodeData } from "./OrgNode";
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
    "Master — drag nodes to reposition · drag a node's bottom dot to another node to connect · Shift+drag to box-select · scroll to zoom",
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
  const selectNode = useOrg((s) => s.selectNode);
  const openSidePanel = useUi((s) => s.openSidePanel);
  const showConfirm = useUi((s) => s.showConfirm);
  const fullscreen = useUi((s) => s.fullscreen);

  const nodeTypes = useMemo(() => ({ org: OrgNode }), []);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode<OrgNodeData>>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<RFEdge>([]);

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
        style: n.size ? { width: n.size.w } : { width: NODE_W },
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
        style: { stroke: from.color, strokeOpacity: 0.6, strokeWidth: 1.8 },
      });
    }
    setRfEdges(built);
  }, [connections, nodes, filters, currentView, lineStyle, setRfEdges]);

  const onConnect = useCallback(
    (c: RFConnection) => {
      if (c.source && c.target) addConnection(c.source, c.target);
    },
    [addConnection]
  );

  const onNodeDragStop = useCallback(
    (_e: MouseEvent | TouchEvent, node: RFNode, dragged: RFNode[]) => {
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
          onPaneClick={() => selectNode(null)}
          deleteKeyCode={null}
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
        </ReactFlow>
      </div>
    </div>
  );
}
