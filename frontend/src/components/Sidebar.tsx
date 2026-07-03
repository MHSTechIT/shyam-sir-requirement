import { Sprout } from "lucide-react";
import { useOrg } from "../store/orgStore";
import { VIEW_TABS } from "../lib/constants";
import { VIEW_ICONS } from "../lib/icons";
import type { ViewKey } from "../types";

export function Sidebar() {
  const currentView = useOrg((s) => s.currentView);
  const setView = useOrg((s) => s.setView);

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

      <div className="sb-foot">Org Chart OS</div>
    </aside>
  );
}
