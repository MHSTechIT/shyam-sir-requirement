import {
  Plus,
  Spline,
  Minus,
  CornerDownRight,
  Undo2,
  Redo2,
  Save,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { useOrg } from "../store/orgStore";
import { useUi } from "../store/uiStore";
import { VIEW_TABS, CANVAS_VIEWS } from "../lib/constants";
import { VIEW_ICONS } from "../lib/icons";
import type { LineStyle } from "../types";

const LINE_STYLES: { key: LineStyle; icon: LucideIcon; title: string }[] = [
  { key: "curved", icon: Spline, title: "Curved" },
  { key: "straight", icon: Minus, title: "Straight" },
  { key: "orthogonal", icon: CornerDownRight, title: "L-shape" },
];

export function Toolbar() {
  const {
    currentView,
    filters,
    toggleFilter,
    lineStyle,
    setLineStyle,
    undo,
    redo,
    undoStack,
    redoStack,
    dirty,
    saving,
    save,
    groups,
  } = useOrg();
  const openAddNode = useUi((s) => s.openAddNode);
  const openGroups = useUi((s) => s.openGroups);

  const isCanvas = CANVAS_VIEWS.includes(currentView);
  const TitleIcon = VIEW_ICONS[currentView];
  const title = VIEW_TABS.find((t) => t.key === currentView)?.label ?? "";

  return (
    <div id="toolbar">
      {/* Row 1 — page title + project filters */}
      <div className="tb-row">
        <span id="tb-title">
          {TitleIcon && <TitleIcon size={18} strokeWidth={2.2} />}
          {title}
        </span>
        {currentView === "master" && (
          <>
            <div className="tb-sep" />
            <div id="proj-filters">
              {groups.map((g) => (
                <button
                  key={g.id}
                  className={`pf-btn ${filters[g.id] === false ? "off" : ""}`}
                  style={{ color: g.color, borderColor: g.color }}
                  onClick={() => toggleFilter(g.id)}
                  title={`Toggle ${g.name}`}
                >
                  {g.name}
                </button>
              ))}
              <button
                className="pf-btn pf-add"
                onClick={openGroups}
                title="Add / manage colors"
              >
                <Palette size={12} /> Colors
              </button>
            </div>
          </>
        )}
      </div>

      {/* Row 2 — actions */}
      <div className="tb-row">
        {isCanvas && (
          <>
            <button className="tb-btn" onClick={openAddNode}>
              <Plus size={15} />
              Node
            </button>
            <div className="tb-sep" />
            <div className="ls-controls" title="Connection line style">
              {LINE_STYLES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    className={`ls-btn ${lineStyle === s.key ? "active" : ""}`}
                    title={s.title}
                    onClick={() => setLineStyle(s.key)}
                  >
                    <Icon size={15} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="tb-sep" />
        <button className="tb-btn" onClick={undo} disabled={!undoStack.length} title="Undo">
          <Undo2 size={14} />
          Undo
        </button>
        <button className="tb-btn" onClick={redo} disabled={!redoStack.length} title="Redo">
          <Redo2 size={14} />
          Redo
        </button>

        <div className="tb-spacer" />

        <span id="save-status" className={dirty ? "dirty" : "saved"}>
          <span className="ss-dot" />
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <button
          className="tb-btn save"
          onClick={save}
          disabled={!dirty || saving}
          title="Save all changes to the database"
        >
          <Save size={14} />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
