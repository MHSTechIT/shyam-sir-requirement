import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { HistoryEntry } from "../types";

export function HistoryView() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPage = async (before?: string) => {
    setLoading(true);
    const res = await api.getHistory(200, before);
    setTotal(res.total);
    setEntries((prev) => (before ? [...prev, ...res.entries] : res.entries));
    setLoading(false);
  };

  useEffect(() => {
    fetchPage().catch(() => setLoading(false));
  }, []);

  return (
    <div className="scroll-view">
      <h2 className="view-title">Change History</h2>
      <div className="view-subtitle">
        Every edit, move, addition and deletion is recorded in the database — {total} total entries.
      </div>
      <div className="hist-list">
        {!loading && entries.length === 0 && (
          <div className="hist-empty">No history yet — start editing to see actions here.</div>
        )}
        {entries.map((h) => (
          <div className="hist-row" key={h.id}>
            <div className="hist-time">{new Date(h.ts).toLocaleString()}</div>
            <div className="hist-action">{h.action}</div>
          </div>
        ))}
        {loading && <div className="hist-empty">Loading…</div>}
        {!loading && entries.length < total && (
          <button
            className="load-more"
            onClick={() => fetchPage(entries[entries.length - 1]?.ts)}
          >
            Load older entries
          </button>
        )}
      </div>
    </div>
  );
}
