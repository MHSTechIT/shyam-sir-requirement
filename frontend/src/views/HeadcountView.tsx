import { useOrg } from "../store/orgStore";
import { aggregateAll } from "../lib/selectors";
import type { OrgNode, Status } from "../types";

const GROUP_META: Record<string, { label: string; color: string }> = {
  ops: { label: "Operations & R&D", color: "#1e88e5" },
  wc: { label: "Wellness Center", color: "#ff7043" },
  dev: { label: "Development", color: "#7c4dff" },
  mkt: { label: "Marketing", color: "#f06292" },
  vsl: { label: "VSL Project", color: "#26c6da" },
  col: { label: "Collaboration", color: "#66bb6a" },
};

export function HeadcountView() {
  const nodes = useOrg((s) => s.nodes);
  // The Headcount table is always editable (the toolbar Edit toggle was removed).
  const editMode = true;
  const updateNode = useOrg((s) => s.updateNode);

  const total = aggregateAll(nodes);

  const groups: Record<string, OrgNode[]> = {};
  for (const n of Object.values(nodes)) {
    if (n.view !== "master" || !n.hc) continue;
    (groups[n.project] ||= []).push(n);
  }

  const setHc = (n: OrgNode, key: "req" | "have" | "notice", value: number) => {
    const hc = { ...(n.hc || { req: 0, have: 0, hire: 0, notice: 0 }), [key]: value };
    hc.hire = Math.max(0, hc.req - hc.have);
    updateNode(n.id, { hc }, { silent: true });
  };

  return (
    <div className="scroll-view">
      <div className="global-summary">
        <span className="gs-chip">Positions <b>{total.total}</b></span>
        <span className="gs-chip ok">Working <b>{total.active}</b></span>
        <span className="gs-chip">Required <b>{total.req}</b></span>
        <span className="gs-chip ok">Have <b>{total.have}</b></span>
        <span className="gs-chip warn">To Hire <b>{total.hire > 0 ? "+" + total.hire : "0"}</b></span>
        <span className="gs-chip" style={{ borderColor: "#ef9a9a", color: "#ef9a9a" }}>
          Notice <b>{total.notice}</b>
        </span>
      </div>

      {Object.keys(GROUP_META).map((proj) => {
        const list = groups[proj];
        if (!list || !list.length) return null;
        const meta = GROUP_META[proj];
        let req = 0, have = 0, hire = 0, notice = 0;
        for (const n of list) {
          req += n.hc!.req || 0;
          have += n.hc!.have || 0;
          hire += Math.max(0, (n.hc!.req || 0) - (n.hc!.have || 0));
          notice += n.hc!.notice || 0;
        }
        return (
          <div className="tbl-section" key={proj}>
            <div className="tbl-hdr">
              <span className="tbl-hdr-dot" style={{ background: meta.color }} />
              <span className="tbl-hdr-title">{meta.label}</span>
              <span className="tbl-hdr-sub">{list.length} position{list.length === 1 ? "" : "s"}</span>
              <div className="tbl-hdr-stats">
                <span className="tbl-hdr-chip">Req {req}</span>
                <span className="tbl-hdr-chip" style={{ color: "#69f0ae" }}>Have {have}</span>
                <span className="tbl-hdr-chip" style={{ color: hire > 0 ? "#ffd166" : "#69f0ae" }}>
                  {hire > 0 ? `+${hire} hire` : "✓ full"}
                </span>
                {notice > 0 && (
                  <span className="tbl-hdr-chip" style={{ color: "#ef9a9a" }}>{notice} notice</span>
                )}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Name</th>
                  <th className="num">Req</th>
                  <th className="num">Have</th>
                  <th className="num">To Hire</th>
                  <th className="num">Notice</th>
                  <th className="num">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((n) => {
                  const hireVal = Math.max(0, (n.hc!.req || 0) - (n.hc!.have || 0));
                  return (
                    <tr key={n.id}>
                      <td>
                        {editMode ? (
                          <input className="tbl-input" value={n.title} onChange={(e) => updateNode(n.id, { title: e.target.value }, { silent: true })} />
                        ) : (
                          n.title
                        )}
                      </td>
                      <td>
                        {editMode ? (
                          <input className="tbl-input" value={n.sub} onChange={(e) => updateNode(n.id, { sub: e.target.value }, { silent: true })} />
                        ) : (
                          n.sub || "—"
                        )}
                      </td>
                      <td className="num">
                        {editMode ? (
                          <input className="tbl-input num" type="number" value={n.hc!.req} onChange={(e) => setHc(n, "req", +e.target.value)} />
                        ) : (
                          n.hc!.req
                        )}
                      </td>
                      <td className="num">
                        {editMode ? (
                          <input className="tbl-input num" type="number" value={n.hc!.have} onChange={(e) => setHc(n, "have", +e.target.value)} />
                        ) : (
                          n.hc!.have
                        )}
                      </td>
                      <td className="num">
                        {hireVal > 0 ? (
                          <span className="badge badge-hire">+{hireVal}</span>
                        ) : (
                          <span className="badge badge-ok">✓</span>
                        )}
                      </td>
                      <td className="num">
                        {editMode ? (
                          <input className="tbl-input num" type="number" value={n.hc!.notice} onChange={(e) => setHc(n, "notice", +e.target.value)} />
                        ) : (
                          n.hc!.notice || 0
                        )}
                      </td>
                      <td className="num">
                        <select
                          className="tbl-input"
                          value={n.status}
                          onChange={(e) => updateNode(n.id, { status: e.target.value as Status }, { silent: true })}
                          disabled={!editMode}
                        >
                          <option value="active">Active</option>
                          <option value="hiring">Hiring</option>
                          <option value="future">Future</option>
                          <option value="notice">Notice</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
