import { AlertTriangle, HelpCircle } from "lucide-react";
import { useUi } from "../store/uiStore";

export function ConfirmModal() {
  const confirm = useUi((s) => s.confirm);
  const close = useUi((s) => s.closeConfirm);
  if (!confirm) return null;

  const Icon = confirm.danger ? AlertTriangle : HelpCircle;

  return (
    <>
      <div id="overlay" onClick={close} />
      <div className="modal" style={{ width: 380 }}>
        <div className="cm-icon" style={{ color: confirm.danger ? "var(--err)" : "var(--accent)" }}>
          <Icon size={34} strokeWidth={2} />
        </div>
        <div className="cm-title">{confirm.title}</div>
        <div className="cm-msg">{confirm.msg}</div>
        <div className="cm-actions">
          <button className="cm-btn" onClick={close}>Cancel</button>
          <button
            className={`cm-btn ${confirm.danger ? "danger" : "primary"}`}
            onClick={() => {
              confirm.onYes();
              close();
            }}
          >
            {confirm.primary || "OK"}
          </button>
        </div>
      </div>
    </>
  );
}
