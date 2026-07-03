import { useOrg } from "../store/orgStore";
import {
  aggregateAll,
  aggregateProject,
  aggregateBranch,
  type Agg,
} from "../lib/selectors";
import { SCORECARD_ICONS } from "../lib/icons";

export function ScorecardView() {
  const nodes = useOrg((s) => s.nodes);
  const connections = useOrg((s) => s.connections);

  const defs: {
    key: string;
    label: string;
    sub: string;
    color: string;
    data: Agg;
  }[] = [
    { key: "all", label: "All Projects", sub: "Organization-wide", color: "#6d28d9", data: aggregateAll(nodes) },
    { key: "ops", label: "Operations & R&D", sub: "Leadership", color: "#1e88e5", data: aggregateProject("ops", nodes) },
    { key: "wc", label: "Wellness Center", sub: "Project · 3 branches", color: "#ff7043", data: aggregateProject("wc", nodes) },
    { key: "an", label: "A/N Branch", sub: "Sub-block of WC", color: "#ff7043", data: aggregateBranch("wc-abm-an", nodes, connections) },
    { key: "kum", label: "Kumananchavadi", sub: "Sub-block of WC", color: "#ff7043", data: aggregateBranch("wc-abm-kum", nodes, connections) },
    { key: "dev", label: "Development", sub: "Common · Tech", color: "#7c4dff", data: aggregateProject("dev", nodes) },
    { key: "mkt", label: "Marketing", sub: "Common · Abi", color: "#f06292", data: aggregateProject("mkt", nodes) },
    { key: "vsl", label: "VSL Project", sub: "BDM: Robin", color: "#26c6da", data: aggregateProject("vsl", nodes) },
    { key: "col", label: "Collaboration", sub: "BDM: Ram Ravanan", color: "#66bb6a", data: aggregateProject("col", nodes) },
  ];

  return (
    <div className="scroll-view">
      <h2 className="view-title">Project Scorecards</h2>
      <div className="view-subtitle">
        Live headcount, hiring status and capacity for every project &amp; block
      </div>
      <div className="sc-grid">
        {defs
          .filter((d) => d.data.total > 0)
          .map((sc) => {
            const d = sc.data;
            const Icon = SCORECARD_ICONS[sc.key];
            const pct = d.req > 0 ? Math.round((d.have / d.req) * 100) : 100;
            const barClass = d.hire === 0 ? "ok" : pct > 50 ? "warn" : "empty";
            const footerCls = d.hire === 0 ? "ok" : "warn";
            const footerMsg =
              d.hire === 0
                ? `Fully staffed · ${d.have}/${d.req} filled`
                : `Hiring · ${d.hire} open ${d.notice > 0 ? `· ${d.notice} on notice` : ""}`;
            return (
              <div className="sc-card" key={sc.key}>
                <div
                  className="sc-card-hdr"
                  style={{ background: `${sc.color}1f`, borderBottom: `1px solid ${sc.color}40` }}
                >
                  <span className="sc-card-icon" style={{ color: sc.color }}>
                    {Icon && <Icon size={20} strokeWidth={2.2} />}
                  </span>
                  <div>
                    <div className="sc-card-title" style={{ color: sc.color }}>{sc.label}</div>
                    <div className="sc-card-sub">{sc.sub}</div>
                  </div>
                </div>
                <div className="sc-card-body">
                  <div className="sc-stat-grid">
                    <Stat val={d.active} label="Working" cls={d.active > 0 ? "ok" : "muted"} />
                    <Stat val={d.hiring} label="Hiring" cls={d.hiring > 0 ? "warn" : "muted"} />
                    <Stat val={d.future} label="New Pos" cls="muted" />
                    <Stat val={d.notice} label="Notice" cls={d.notice > 0 ? "notice" : "muted"} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)", marginTop: 6 }}>
                    <span>Filled: {d.have}/{d.req}</span>
                    <span style={{ fontWeight: 700, color: d.hire > 0 ? "#ffd166" : "#69f0ae" }}>
                      {d.hire > 0 ? `+${d.hire} to hire` : "✓ Full"}
                    </span>
                  </div>
                  <div className="sc-bar-wrap">
                    <div className={`sc-bar ${barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className={`sc-footer ${footerCls}`}>
                  <span className="dot" />
                  {footerMsg}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Stat({ val, label, cls }: { val: number; label: string; cls: string }) {
  return (
    <div className="sc-stat-cell">
      <div className={`sc-stat-val ${cls}`}>{val}</div>
      <div className="sc-stat-label">{label}</div>
    </div>
  );
}
