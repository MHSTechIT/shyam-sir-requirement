import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export type SelectOption = { value: string; label: string };

/**
 * Themed dropdown that matches the app's violet UI. Replaces the native
 * <select>, whose option list is OS-drawn (blue highlight) and can't be styled.
 */
export function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div className={`ui-select ${open ? "open" : ""}`} ref={ref}>
      <button type="button" className="ui-select-btn" onClick={() => setOpen((v) => !v)}>
        <span>{current?.label ?? value}</span>
        <ChevronDown size={16} className={`ui-select-chev ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="ui-select-menu">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              className={`ui-select-opt ${o.value === value ? "active" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
