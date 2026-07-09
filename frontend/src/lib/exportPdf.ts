import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
  getNodesBounds,
  getViewportForBounds,
  type ReactFlowInstance,
} from "@xyflow/react";

const CANVAS_VIEWS = ["master", "wc", "vsl", "col"];

type Shot = { dataUrl: string; w: number; h: number };

// html-to-image can throw while trying to inline cross-origin webfonts. Retry
// once without font embedding so a font hiccup never blocks the export.
async function toPngSafe(el: HTMLElement, opts: Parameters<typeof toPng>[1]): Promise<string> {
  try {
    return await toPng(el, opts);
  } catch {
    return await toPng(el, { ...opts, skipFonts: true });
  }
}

// Canvas views: rasterise the React Flow viewport, re-framed to fit every node
// (independent of the user's current pan/zoom). Mirrors RF's own export example.
async function shootCanvas(rf: ReactFlowInstance): Promise<Shot> {
  const nodes = rf.getNodes();
  if (!nodes.length) throw new Error("Nothing to export in this view.");
  const bounds = getNodesBounds(nodes);
  const pad = 48;
  const w = Math.max(1, Math.ceil(bounds.width + pad * 2));
  const h = Math.max(1, Math.ceil(bounds.height + pad * 2));
  const vp = getViewportForBounds(bounds, w, h, 0.2, 2, pad);
  const el = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!el) throw new Error("Canvas not found.");
  const dataUrl = await toPngSafe(el, {
    backgroundColor: "#ffffff",
    width: w,
    height: h,
    pixelRatio: 2,
    style: {
      width: `${w}px`,
      height: `${h}px`,
      transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
    },
  });
  return { dataUrl, w, h };
}

// Data views (Scorecards / Headcount / History): capture the full scrollable
// content of the .scroll-view container, not just the visible slice.
async function shootElement(selector: string): Promise<Shot> {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error("View not found.");
  const w = Math.max(el.scrollWidth, el.clientWidth);
  const h = Math.max(el.scrollHeight, el.clientHeight);
  const dataUrl = await toPngSafe(el, {
    backgroundColor: "#ffffff",
    width: w,
    height: h,
    pixelRatio: 2,
    style: { width: `${w}px`, height: `${h}px`, overflow: "visible", maxHeight: "none" },
  });
  return { dataUrl, w, h };
}

/**
 * Export the currently-visible view to a single-page PDF and trigger a download.
 * `rf` is only needed (and used) for the canvas/org-chart views.
 */
export async function exportViewToPdf(
  view: string,
  title: string,
  rf?: ReactFlowInstance | null
): Promise<void> {
  const shot =
    CANVAS_VIEWS.includes(view) && rf ? await shootCanvas(rf) : await shootElement(".scroll-view");

  const orientation = shot.w >= shot.h ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [shot.w, shot.h], compress: true });
  pdf.addImage(shot.dataUrl, "PNG", 0, 0, shot.w, shot.h);

  const stamp = new Date().toISOString().slice(0, 10);
  const safe = (title || "export").replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "export";
  pdf.save(`${safe}_${stamp}.pdf`);
}
