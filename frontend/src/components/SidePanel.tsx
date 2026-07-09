import { useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Paperclip, Eye, Save, X, Plus } from "lucide-react";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { api } from "../api/client";
import { NODE_W, NODE_H, SIZE_PRESETS } from "../lib/constants";
import type { Status, HistoryEntry } from "../types";

const TABS = [
  ["overview", "Overview"],
  ["hc", "Headcount"],
  ["rr", "R&R"],
  ["kpi", "KPIs"],
  ["kra", "KRAs"],
  ["doc", "Document"],
  ["size", "Size"],
] as const;
type Tab = (typeof TABS)[number][0];

function fmtBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

export function SidePanel() {
  const nodeId = useUi((s) => s.sidePanelNodeId);
  const close = useUi((s) => s.closeSidePanel);
  const openPdf = useUi((s) => s.openPdf);
  const node = useOrg((s) => (nodeId ? s.nodes[nodeId] : null));
  const file = useOrg((s) => (nodeId ? s.files[nodeId] : null));
  const updateNode = useOrg((s) => s.updateNode);
  const uploadFile = useOrg((s) => s.uploadFile);
  const removeFile = useOrg((s) => s.removeFile);
  // lastSavedAt bumps on every successful mutation → use it to live-refresh
  // this node's activity log.
  const lastSavedAt = useOrg((s) => s.lastSavedAt);

  const [tab, setTab] = useState<Tab>("overview");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  // form state
  const [f, setF] = useState({
    title: "",
    badge: "",
    sub: "",
    reports_to: "",
    dept: "",
    status: "active" as Status,
    req: 0,
    have: 0,
    notice: 0,
    responsibilities: "",
    kpis: [] as string[],
    kras: [] as string[],
    doc_notes: "",
    doc_link: "",
    w: NODE_W,
    h: NODE_H,
  });

  useEffect(() => {
    if (!node) return;
    setTab("overview");
    setF({
      title: node.title,
      badge: node.badge,
      sub: node.sub,
      reports_to: node.clarity?.reports_to || "",
      dept: node.clarity?.dept || node.project,
      status: node.status,
      req: node.hc?.req || 0,
      have: node.hc?.have || 0,
      notice: node.hc?.notice || 0,
      responsibilities: node.clarity?.responsibilities || "",
      kpis: node.clarity?.kpis || [],
      kras: node.clarity?.kras || [],
      doc_notes: node.clarity?.doc_notes || "",
      doc_link: node.clarity?.doc_link || "",
      w: node.size?.w || NODE_W,
      h: node.size?.h || NODE_H,
    });
  }, [nodeId, node]);

  // Live per-node activity log: refetch when the panel opens for a node and
  // whenever any mutation completes (lastSavedAt changes).
  useEffect(() => {
    if (!nodeId) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    api
      .getNodeHistory(nodeId)
      .then((r) => {
        if (!cancelled) setHistory(r.entries);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [nodeId, lastSavedAt]);

  if (!node || !nodeId) return <div id="side-panel" />;

  const save = () => {
    const req = Number(f.req) || 0;
    const have = Number(f.have) || 0;
    const notice = Number(f.notice) || 0;
    const hc =
      req > 0 || have > 0 || notice > 0
        ? { req, have, hire: Math.max(0, req - have), notice }
        : null;
    const w = Number(f.w) || NODE_W;
    const h = Number(f.h) || NODE_H;
    const size = w !== NODE_W || h !== NODE_H ? { w, h } : null;
    updateNode(nodeId, {
      title: f.title || "Untitled",
      badge: f.badge || "ROLE",
      sub: f.sub,
      status: f.status,
      hc,
      size,
      clarity: {
        reports_to: f.reports_to,
        dept: f.dept,
        responsibilities: f.responsibilities,
        kpis: f.kpis.map((x) => x.trim()).filter(Boolean),
        kras: f.kras.map((x) => x.trim()).filter(Boolean),
        doc_notes: f.doc_notes,
        doc_link: f.doc_link,
      },
    });
    useOrg.getState().toast("Role updated — click Save to persist");
    close();
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(nodeId, file);
    e.target.value = "";
  };

  const listEditor = (key: "kpis" | "kras", label: string) => (
    <>
      {f[key].map((val, i) => (
        <div className="sp-list-row" key={i}>
          <input
            className="sp-input"
            placeholder={label}
            value={val}
            onChange={(e) =>
              setF((s) => {
                const arr = [...s[key]];
                arr[i] = e.target.value;
                return { ...s, [key]: arr };
              })
            }
          />
          <button
            className="sp-list-del"
            onClick={() => setF((s) => ({ ...s, [key]: s[key].filter((_, j) => j !== i) }))}
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <button
        className="sp-add-btn"
        onClick={() => setF((s) => ({ ...s, [key]: [...s[key], ""] }))}
      >
        <Plus size={13} /> Add {label}
      </button>
    </>
  );

  return (
    <div id="side-panel" className="show">
      <div className="sp-header">
        <span className="sp-color" style={{ background: node.color }} />
        <span className="sp-title">{node.title}</span>
        <button className="sp-close" onClick={close}>
          <X size={18} />
        </button>
      </div>

      <div className="sp-tabs">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            className={`sp-tab ${tab === k ? "active" : ""}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="sp-body">
        {tab === "overview" && (
          <>
            <Field label="Title">
              <input className="sp-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </Field>
            <Field label="Badge / Role label">
              <input className="sp-input" value={f.badge} onChange={(e) => setF({ ...f, badge: e.target.value })} />
            </Field>
            <Field label="Sub-text / Person name">
              <input className="sp-input" value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })} />
            </Field>
            <Field label="Reports To">
              <input className="sp-input" value={f.reports_to} onChange={(e) => setF({ ...f, reports_to: e.target.value })} />
            </Field>
            <Field label="Department">
              <input className="sp-input" value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })} />
            </Field>
            <Field label="Status">
              <select
                className="sp-select"
                value={f.status}
                onChange={(e) => setF({ ...f, status: e.target.value as Status })}
              >
                <option value="active">Active</option>
                <option value="hiring">Hiring</option>
                <option value="future">Future Hire</option>
                <option value="notice">On Notice Period</option>
              </select>
            </Field>
          </>
        )}

        {tab === "hc" && (
          <>
            <Field label="Required Positions">
              <input className="sp-input" type="number" min={0} value={f.req} onChange={(e) => setF({ ...f, req: +e.target.value })} />
            </Field>
            <Field label="Currently Have">
              <input className="sp-input" type="number" min={0} value={f.have} onChange={(e) => setF({ ...f, have: +e.target.value })} />
            </Field>
            <Field label="On Notice Period">
              <input className="sp-input" type="number" min={0} value={f.notice} onChange={(e) => setF({ ...f, notice: +e.target.value })} />
            </Field>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>
              To-Hire is calculated automatically as Required − Have.
            </div>
          </>
        )}

        {tab === "rr" && (
          <Field label="Roles & Responsibilities">
            <textarea
              className="sp-textarea"
              style={{ minHeight: 280 }}
              value={f.responsibilities}
              onChange={(e) => setF({ ...f, responsibilities: e.target.value })}
              placeholder="List key duties, one per line…"
            />
          </Field>
        )}

        {tab === "kpi" && <Field label="Key Performance Indicators">{listEditor("kpis", "KPI")}</Field>}
        {tab === "kra" && <Field label="Key Result Areas">{listEditor("kras", "KRA")}</Field>}

        {tab === "doc" && (
          <>
            <div className="sp-field-label">Role Clarity Document</div>
            <div
              className={`sp-upload-zone ${file ? "has-file" : ""}`}
              onClick={() => !file && fileInput.current?.click()}
            >
              {file ? (
                <div className="sp-file-info">
                  <div className="sp-file-icon">
                    {file.mimeType.includes("image") ? (
                      <ImageIcon size={22} />
                    ) : file.mimeType.includes("pdf") ? (
                      <FileText size={22} />
                    ) : (
                      <Paperclip size={22} />
                    )}
                  </div>
                  <div className="sp-file-meta">
                    <div className="sp-file-name">{file.name}</div>
                    <div className="sp-file-size">{fmtBytes(file.size)} · {file.mimeType}</div>
                  </div>
                  <div className="sp-file-actions">
                    <button
                      className="sp-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPdf({ url: api.fileUrl(file.id), name: file.name, mimeType: file.mimeType });
                      }}
                    >
                      <Eye size={12} /> View
                    </button>
                    <button
                      className="sp-file-btn del"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(nodeId);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sp-upload-icon">
                    <Paperclip size={26} />
                  </div>
                  <div className="sp-upload-text">Click to upload Role Clarity document</div>
                  <div className="sp-upload-sub">PDF, Word, or image • Max 4 MB</div>
                </>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              style={{ display: "none" }}
              accept="application/pdf,.doc,.docx,image/*"
              onChange={onPickFile}
            />
            <Field label="External Link (optional)" style={{ marginTop: 14 }}>
              <input className="sp-input" value={f.doc_link} onChange={(e) => setF({ ...f, doc_link: e.target.value })} placeholder="https://docs.google.com/..." />
            </Field>
            <Field label="Notes">
              <textarea className="sp-textarea" value={f.doc_notes} onChange={(e) => setF({ ...f, doc_notes: e.target.value })} />
            </Field>
          </>
        )}

        {tab === "size" && (
          <>
            <div className="sp-field-label">Size Presets</div>
            <div className="sp-size-presets">
              {SIZE_PRESETS.map((p) => (
                <button
                  key={p.key}
                  className={`sp-preset-btn ${f.w === p.w && f.h === p.h ? "active" : ""}`}
                  onClick={() => setF({ ...f, w: p.w, h: p.h })}
                  title={`${p.w}×${p.h}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="sp-field-label" style={{ marginTop: 12 }}>Node Width</div>
            <div className="sp-size-row">
              <label>W</label>
              <input type="range" min={140} max={400} step={5} value={f.w} onChange={(e) => setF({ ...f, w: +e.target.value })} />
              <input type="number" min={140} max={500} value={f.w} onChange={(e) => setF({ ...f, w: +e.target.value })} />
            </div>
            <div className="sp-field-label" style={{ marginTop: 12 }}>Node Height (visual hint)</div>
            <div className="sp-size-row">
              <label>H</label>
              <input type="range" min={80} max={320} step={5} value={f.h} onChange={(e) => setF({ ...f, h: +e.target.value })} />
              <input type="number" min={80} max={500} value={f.h} onChange={(e) => setF({ ...f, h: +e.target.value })} />
            </div>
            <button className="sp-add-btn" onClick={() => setF({ ...f, w: NODE_W, h: NODE_H })}>
              Reset to default ({NODE_W}×{NODE_H})
            </button>
          </>
        )}
        <div className="sp-activity">
          <div className="sp-activity-title">
            Activity / History{history.length ? ` (${history.length})` : ""}
          </div>
          {history.length === 0 ? (
            <div className="sp-hist-empty">No history yet for this role.</div>
          ) : (
            history.map((h) => (
              <div className="sp-hist-card" key={h.id}>
                <div className="sp-hist-action">{h.action}</div>
                <div className="sp-hist-time">{new Date(h.ts).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sp-footer">
        <div className="sp-footer-left" />
        <div style={{ display: "flex", gap: 6 }}>
          <button className="tb-btn" onClick={close}>Cancel</button>
          <button className="tb-btn save" onClick={save}><Save size={14} /> Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="sp-field" style={style}>
      <div className="sp-field-label">{label}</div>
      {children}
    </div>
  );
}
