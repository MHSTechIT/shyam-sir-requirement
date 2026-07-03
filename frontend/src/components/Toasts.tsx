import { useOrg } from "../store/orgStore";

export function Toasts() {
  const toasts = useOrg((s) => s.toasts);
  return (
    <div id="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
