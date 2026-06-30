import { useState } from "react";
import { Plus } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { COLOR_PALETTE } from "../lib/constants";
import type { Status } from "../types";

const PROJECTS = [
  ["ops", "Operations / R&D"],
  ["wc", "Wellness Center"],
  ["vsl", "VSL"],
  ["col", "Collaboration"],
  ["dev", "Development"],
  ["mkt", "Marketing"],
  ["shared", "Shared"],
];

export function AddNodeModal() {
  const open = useUi((s) => s.addNodeOpen);
  const close = useUi((s) => s.closeAddNode);
  const addNode = useOrg((s) => s.addNode);
  const currentView = useOrg((s) => s.currentView);
  const flow = useReactFlow();

  const [badge, setBadge] = useState("");
  const [title, setTitle] = useState("");
  const [sub, setSub] = useState("");
  const [status, setStatus] = useState<Status>("active");
  const [project, setProject] = useState("ops");
  const [color, setColor] = useState(COLOR_PALETTE[0].hex);

  if (!open) return null;

  const submit = () => {
    // Drop the node near the centre of the current viewport.
    let x = 200;
    let y = 200;
    try {
      const c = flow.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      x = Math.round(c.x);
      y = Math.round(c.y);
    } catch {
      /* flow not ready */
    }
    addNode({
      badge: badge || "ROLE",
      title: title || "New Node",
      sub,
      status,
      project,
      color,
      view: currentView,
      x,
      y,
    });
    setBadge("");
    setTitle("");
    setSub("");
    close();
  };

  return (
    <>
      <div id="overlay" onClick={close} />
      <div className="modal">
        <h3>＋ Add New Node</h3>
        <div className="sp-field">
          <div className="sp-field-label">Badge / Role Label</div>
          <input className="sp-input" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. BDM, ABM, LEAD" />
        </div>
        <div className="sp-field">
          <div className="sp-field-label">Title</div>
          <input className="sp-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Area Branch Manager" />
        </div>
        <div className="sp-field">
          <div className="sp-field-label">Sub-text / Person</div>
          <input className="sp-input" value={sub} onChange={(e) => setSub(e.target.value)} placeholder="e.g. Pavithra B" />
        </div>
        <div className="sp-field">
          <div className="sp-field-label">Status</div>
          <select className="sp-select" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="active">Active</option>
            <option value="hiring">Hiring</option>
            <option value="future">Future</option>
            <option value="notice">Notice</option>
          </select>
        </div>
        <div className="sp-field">
          <div className="sp-field-label">Project</div>
          <select className="sp-select" value={project} onChange={(e) => setProject(e.target.value)}>
            {PROJECTS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="sp-field">
          <div className="sp-field-label">Color</div>
          <div className="color-swatches">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                className={`cs-btn ${color === c.hex ? "selected" : ""}`}
                style={{ background: c.hex }}
                title={c.label}
                onClick={() => setColor(c.hex)}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="tb-btn" style={{ flex: 1 }} onClick={close}>Cancel</button>
          <button className="tb-btn save" style={{ flex: 1, justifyContent: "center" }} onClick={submit}>
            <Plus size={15} /> Add Node
          </button>
        </div>
      </div>
    </>
  );
}
