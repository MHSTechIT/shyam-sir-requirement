import { useState } from "react";
import { Sprout, FileDown, Loader2 } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { useOrg } from "../store/orgStore";
import { VIEW_TABS } from "../lib/constants";
import { VIEW_ICONS } from "../lib/icons";
import type { ViewKey } from "../types";

export function Sidebar() {
  const currentView = useOrg((s) => s.currentView);
  const setView = useOrg((s) => s.setView);
  const rf = useReactFlow();
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    if (exporting) return;
    const label = VIEW_TABS.find((t) => t.key === currentView)?.label ?? "Export";
    setExporting(true);
    useOrg.getState().toast("Preparing PDF…");
    try {
      // Lazy-loaded so jsPDF/html-to-image stay out of the initial bundle.
      const { exportViewToPdf } = await import("../lib/exportPdf");
      await exportViewToPdf(currentView, label, rf);
      useOrg.getState().toast("PDF downloaded");
    } catch (e) {
      useOrg.getState().toast(`Export failed: ${(e as Error).message}`, "err");
    } finally {
      setExporting(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <span className="sb-logo">
          <Sprout size={24} strokeWidth={2.2} />
        </span>
        <div>
          <div className="sb-name">MHS OrgOS</div>
          <div className="sb-sub">Admin Panel</div>
        </div>
      </div>

      <nav className="sb-nav">
        {VIEW_TABS.map((t) => {
          const Icon = VIEW_ICONS[t.key];
          return (
            <button
              key={t.key}
              className={`sb-item ${currentView === t.key ? "active" : ""}`}
              onClick={() => setView(t.key as ViewKey)}
            >
              <span className="sb-ico">{Icon && <Icon size={17} strokeWidth={2.2} />}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        className="sb-export"
        onClick={exportPdf}
        disabled={exporting}
        title="Export the current view as a PDF"
      >
        <span className="sb-ico">
          {exporting ? <Loader2 size={16} className="spin" /> : <FileDown size={16} strokeWidth={2.2} />}
        </span>
        <span>{exporting ? "Exporting…" : "Export PDF"}</span>
      </button>

      <div className="sb-foot">Org Chart OS</div>
    </aside>
  );
}
