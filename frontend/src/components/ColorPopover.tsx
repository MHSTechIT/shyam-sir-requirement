import { useEffect } from "react";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { COLOR_PALETTE } from "../lib/constants";

export function ColorPopover() {
  const color = useUi((s) => s.color);
  const close = useUi((s) => s.closeColor);
  const updateNode = useOrg((s) => s.updateNode);

  useEffect(() => {
    if (!color) return;
    const onDoc = () => close();
    // Close on next click anywhere.
    const t = setTimeout(() => document.addEventListener("click", onDoc, { once: true }), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onDoc);
    };
  }, [color, close]);

  if (!color) return null;

  return (
    <div
      className="color-popover"
      style={{ left: Math.max(8, color.x), top: color.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {COLOR_PALETTE.map((c) => (
        <button
          key={c.hex}
          className="cs-btn"
          style={{ background: c.hex }}
          title={c.label}
          onClick={() => {
            updateNode(color.nodeId, { color: c.hex });
            close();
          }}
        />
      ))}
    </div>
  );
}
