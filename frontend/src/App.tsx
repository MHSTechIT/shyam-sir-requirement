import { useEffect, useState } from "react";
import { Sprout, Save } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { api } from "./api/client";
import { useOrg } from "./store/orgStore";
import { useUi } from "./store/uiStore";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { Canvas } from "./components/Canvas";
import { ScorecardView } from "./views/ScorecardView";
import { HeadcountView } from "./views/HeadcountView";
import { HistoryView } from "./views/HistoryView";
import { SidePanel } from "./components/SidePanel";
import { AddNodeModal } from "./components/AddNodeModal";
import { GroupModal } from "./components/GroupModal";
import { PdfPreview } from "./components/PdfPreview";
import { ConfirmModal } from "./components/ConfirmModal";
import { ColorPopover } from "./components/ColorPopover";
import { Toasts } from "./components/Toasts";

export function App() {
  const [gate, setGate] = useState<"checking" | "login" | "ok">("checking");
  const load = useOrg((s) => s.load);
  const loading = useOrg((s) => s.loading);
  const loadError = useOrg((s) => s.loadError);
  const currentView = useOrg((s) => s.currentView);
  const dirty = useOrg((s) => s.dirty);
  const saving = useOrg((s) => s.saving);
  const fullscreen = useUi((s) => s.fullscreen);
  const setFullscreen = useUi((s) => s.setFullscreen);

  useEffect(() => {
    api
      .authStatus()
      .then((s) => setGate(s.authed ? "ok" : "login"))
      .catch(() => setGate("ok")); // if status fails, assume open
  }, []);

  useEffect(() => {
    if (gate === "ok") load().catch(() => {});
  }, [gate, load]);

  // Ctrl/Cmd+S saves; warn before leaving with unsaved changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        useOrg.getState().save();
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useOrg.getState().dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  // Keep the fullscreen flag in sync with the browser (also catches Esc-exit).
  useEffect(() => {
    const onFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [setFullscreen]);

  if (gate === "checking") return <div className="loading-screen">Loading…</div>;
  if (gate === "login") return <LoginGate onOk={() => setGate("ok")} />;
  if (loading) return <div className="loading-screen">Loading org chart…</div>;
  if (loadError)
    return (
      <div className="loading-screen">
        <div className="login-card">
          <h2 style={{ marginBottom: 6 }}>Couldn’t load the chart</h2>
          <p className="view-subtitle">{loadError}</p>
          <button className="tb-btn save" style={{ marginTop: 12, width: "100%" }} onClick={() => load()}>
            Retry
          </button>
        </div>
      </div>
    );

  const isCanvas = ["master", "wc", "vsl", "col"].includes(currentView);

  return (
    <ReactFlowProvider>
      <div className={`app ${fullscreen ? "fs" : ""}`}>
        <Sidebar />
        <div className="content">
          {currentView !== "scorecard" && currentView !== "history" && <Toolbar />}
          <div className="main">
            {isCanvas && <Canvas />}
            {currentView === "scorecard" && <ScorecardView />}
            {currentView === "table" && <HeadcountView />}
            {currentView === "history" && <HistoryView />}
          </div>
        </div>

        {fullscreen && (
          <button
            className="fs-save tb-btn save"
            onClick={() => useOrg.getState().save()}
            disabled={!dirty || saving}
            title="Save all changes"
          >
            <Save size={15} />
            {saving ? "Saving…" : dirty ? "Save" : "Saved"}
          </button>
        )}

        <SidePanel />
        <PdfPreview />
        <AddNodeModal />
        <GroupModal />
        <ConfirmModal />
        <ColorPopover />
        <Toasts />
      </div>
    </ReactFlowProvider>
  );
}

function LoginGate({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.login(pw);
      onOk();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  return (
    <div className="login-card">
      <h2 style={{ marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Sprout size={22} /> MHS OrgOS
      </h2>
      <p className="view-subtitle">This chart is password protected.</p>
      <form onSubmit={submit}>
        <input
          className="sp-input"
          type="password"
          placeholder="Shared password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
        />
        {err && (
          <div style={{ color: "var(--err)", fontSize: 11, marginTop: 8 }}>{err}</div>
        )}
        <button className="tb-btn save" style={{ marginTop: 12, width: "100%" }} type="submit">
          Enter
        </button>
      </form>
    </div>
  );
}
