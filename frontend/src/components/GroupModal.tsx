import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { COLOR_PALETTE } from "../lib/constants";

export function GroupModal() {
  const open = useUi((s) => s.groupsOpen);
  const close = useUi((s) => s.closeGroups);
  const groups = useOrg((s) => s.groups);
  const addGroup = useOrg((s) => s.addGroup);
  const updateGroup = useOrg((s) => s.updateGroup);
  const deleteGroup = useOrg((s) => s.deleteGroup);
  const showConfirm = useUi((s) => s.showConfirm);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0].hex);

  if (!open) return null;

  const add = async () => {
    if (!newName.trim()) return;
    await addGroup(newName.trim(), newColor);
    setNewName("");
  };

  return (
    <>
      <div id="overlay" onClick={close} />
      <div className="modal" style={{ width: 440 }}>
        <h3>Colors &amp; Filters</h3>
        <p className="view-subtitle" style={{ marginBottom: 14 }}>
          Name a color to create a filter pill. Assign it to nodes in the “Add Node”
          dialog, then toggle it in the filter bar.
        </p>

        {/* existing groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {groups.map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ColorDot color={g.color} onPick={(c) => updateGroup(g.id, { color: c })} />
              <input
                className="sp-input"
                style={{ flex: 1 }}
                defaultValue={g.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== g.name) updateGroup(g.id, { name: v });
                }}
              />
              <button
                className="sp-list-del"
                title="Delete color"
                onClick={() =>
                  showConfirm({
                    title: `Delete "${g.name}"?`,
                    msg: "The filter pill is removed. Nodes keep their color but won't be filterable by it.",
                    primary: "Delete",
                    danger: true,
                    onYes: () => deleteGroup(g.id),
                  })
                }
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {groups.length === 0 && (
            <div className="view-subtitle">No colors yet — add one below.</div>
          )}
        </div>

        {/* add new */}
        <div className="sp-field-label">Add a new color</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <ColorDot color={newColor} onPick={setNewColor} />
          <input
            className="sp-input"
            style={{ flex: 1 }}
            placeholder="Name, e.g. Finance"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="tb-btn save" onClick={add} disabled={!newName.trim()}>
            <Plus size={14} /> Add
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <button className="tb-btn" onClick={close}>Done</button>
        </div>
      </div>
    </>
  );
}

// A swatch that expands to the palette on click.
function ColorDot({ color, onPick }: { color: string; onPick: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        className="cs-btn"
        style={{ background: color, width: 30, height: 30 }}
        title="Change color"
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 2199 }} onClick={() => setOpen(false)} />
          <div className="color-popover" style={{ position: "absolute", top: 36, left: 0, zIndex: 2200 }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                className="cs-btn"
                style={{ background: c.hex }}
                title={c.label}
                onClick={() => {
                  onPick(c.hex);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
