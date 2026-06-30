import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Plus, Minus, Info, Palette, X, Paperclip } from "lucide-react";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { STATUS_META } from "../lib/icons";

export type OrgNodeData = { nodeId: string };
type OrgFlowNode = Node<OrgNodeData, "org">;

export function OrgNode({ data }: NodeProps<OrgFlowNode>) {
  const node = useOrg((s) => s.nodes[data.nodeId]);
  const hasFile = useOrg((s) => Boolean(s.files[data.nodeId]));
  const connections = useOrg((s) => s.connections);
  const currentView = useOrg((s) => s.currentView);
  const deleteNode = useOrg((s) => s.deleteNode);
  const toggleCollapse = useOrg((s) => s.toggleCollapse);
  const openSidePanel = useUi((s) => s.openSidePanel);
  const openColor = useUi((s) => s.openColor);
  const showConfirm = useUi((s) => s.showConfirm);

  if (!node) return null;

  const status = STATUS_META[node.status];
  const StatusIcon = status?.icon;
  const hasChildren = connections.some(
    (c) => c.view === currentView && c.from === node.id
  );
  const hire = node.hc ? Math.max(0, node.hc.req - node.hc.have) : 0;

  return (
    <div className="org-node" style={node.size ? { width: node.size.w } : undefined}>
      <Handle type="target" position={Position.Top} />
      <div className="node-strip" style={{ background: node.color }} />

      <div className="node-actions nodrag">
        {hasChildren && (
          <button
            className="na-btn na-collapse"
            title={node.collapsed ? "Expand" : "Collapse"}
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapse(node.id);
            }}
          >
            {node.collapsed ? <Plus size={13} /> : <Minus size={13} />}
          </button>
        )}
        <button
          className="na-btn na-info"
          title="Role details"
          onClick={(e) => {
            e.stopPropagation();
            openSidePanel(node.id);
          }}
        >
          <Info size={13} />
        </button>
        <button
          className="na-btn na-clr"
          title="Change color"
          onClick={(e) => {
            e.stopPropagation();
            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
            openColor({ nodeId: node.id, x: r.left - 100, y: r.bottom + 6 });
          }}
        >
          <Palette size={13} />
        </button>
        <button
          className="na-btn na-del"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            showConfirm({
              title: "Delete this node?",
              msg: `Remove "${node.title}" and all its connections?`,
              primary: "Delete",
              danger: true,
              onYes: () => deleteNode(node.id),
            });
          }}
        >
          <X size={13} />
        </button>
      </div>

      <div className="node-body">
        <div className="node-badge" style={{ color: node.color }}>
          {node.badge}
        </div>
        <div className="node-name">{node.title}</div>
        {node.sub && <div className="node-sub">{node.sub}</div>}
        <div className="node-tags">
          {status && (
            <span className={`ntag ${status.cls}`}>
              {StatusIcon && <StatusIcon size={10} strokeWidth={2.4} />}
              {status.label}
            </span>
          )}
          {hasFile && (
            <span className="ntag ntag-doc">
              <Paperclip size={10} strokeWidth={2.4} />
              Doc
            </span>
          )}
        </div>
        {node.hc && node.hc.req > 0 && (
          <div className="node-hc">
            <span className="nhc-pill nhc-req">Req:{node.hc.req}</span>
            <span className="nhc-pill nhc-have">Have:{node.hc.have}</span>
            {hire > 0 ? (
              <span className="nhc-pill nhc-hire">+{hire} hire</span>
            ) : (
              <span className="nhc-pill nhc-full">Full</span>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
