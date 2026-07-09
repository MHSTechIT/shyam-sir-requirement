import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { getNodesBounds, type ReactFlowInstance } from "@xyflow/react";
import { useOrg } from "../store/orgStore";
import { NODE_W, NODE_H } from "./constants";

const CANVAS_VIEWS = ["master", "wc", "vsl", "col"];

// ─────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  let h = (hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "6c63ff", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const STATUS_STYLE: Record<string, { bg: RGB; fg: RGB; label: string }> = {
  active: { bg: [231, 243, 238], fg: [21, 128, 61], label: "Active" },
  hiring: { bg: [254, 249, 195], fg: [180, 83, 9], label: "Hiring" },
  future: { bg: [243, 244, 246], fg: [55, 65, 81], label: "Future" },
  notice: { bg: [254, 226, 226], fg: [185, 28, 28], label: "Notice" },
  inactive: { bg: [243, 244, 246], fg: [107, 114, 128], label: "Inactive" },
  future_plan: { bg: [243, 244, 246], fg: [55, 65, 81], label: "Future Plan" },
  upcoming: { bg: [224, 231, 255], fg: [55, 48, 163], label: "Upcoming" },
};

function saveDoc(pdf: jsPDF, title: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const safe = (title || "export").replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "") || "export";
  pdf.save(`${safe}_${stamp}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────
// Vector org-chart renderer (canvas views) — crisp at any zoom, selectable text
// ─────────────────────────────────────────────────────────────────────────

type Geo = { id: string; x: number; y: number; w: number; h: number };

function buildVectorChart(rf: ReactFlowInstance, view: string): jsPDF {
  const store = useOrg.getState();
  const rfNodes = rf.getNodes();
  if (!rfNodes.length) throw new Error("Nothing to export in this view.");

  // Geometry from React Flow (exact on-screen positions & measured sizes).
  const geo = new Map<string, Geo>();
  for (const n of rfNodes) {
    const dom = store.nodes[n.id];
    geo.set(n.id, {
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      w: n.measured?.width ?? dom?.size?.w ?? NODE_W,
      h: n.measured?.height ?? dom?.size?.h ?? NODE_H,
    });
  }

  const bounds = getNodesBounds(rfNodes);
  const pad = 60;
  const W = Math.ceil(bounds.width + pad * 2);
  const H = Math.ceil(bounds.height + pad * 2);
  const X = (x: number) => x - bounds.x + pad;
  const Y = (y: number) => y - bounds.y + pad;

  const pdf = new jsPDF({
    orientation: W >= H ? "landscape" : "portrait",
    unit: "px",
    format: [W, H],
    compress: true,
  });
  pdf.setFont("helvetica", "normal");

  // White page background.
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, W, H, "F");

  // ── Connections (drawn first, under the cards) ──
  const ids = new Set(geo.keys());
  for (const c of store.connections) {
    if (c.view !== view) continue;
    const s = geo.get(c.from);
    const t = geo.get(c.to);
    if (!s || !t || !ids.has(c.from) || !ids.has(c.to)) continue;
    const sx = X(s.x + s.w / 2);
    const sy = Y(s.y + s.h);
    const tx = X(t.x + t.w / 2);
    const ty = Y(t.y);
    const [r, g, b] = hexToRgb(store.nodes[c.from]?.color || "#7c3aed");
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(1.2);
    const midY = sy + (ty - sy) / 2;
    // orthogonal elbow: down · across · down
    pdf.line(sx, sy, sx, midY);
    pdf.line(sx, midY, tx, midY);
    pdf.line(tx, midY, tx, ty - 4);
    // arrowhead into the target's top
    pdf.setFillColor(r, g, b);
    pdf.triangle(tx, ty, tx - 4, ty - 6, tx + 4, ty - 6, "F");
  }

  // ── Node cards ──
  for (const gnode of geo.values()) {
    const node = store.nodes[gnode.id];
    if (!node) continue;
    const px = X(gnode.x);
    const py = Y(gnode.y);
    const w = gnode.w;
    const h = gnode.h;
    const [cr, cg, cb] = hexToRgb(node.color);

    // card
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(214, 209, 230);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(px, py, w, h, 6, 6, "FD");
    // color strip
    pdf.setFillColor(cr, cg, cb);
    pdf.rect(px + 3, py + 1.5, w - 6, 3, "F");

    let cy = py + 14;
    const left = px + 11;
    const textW = w - 22;

    // badge
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(cr, cg, cb);
    pdf.text(String(node.badge || "").toUpperCase().slice(0, 30), left, cy);
    cy += 11;

    // title (up to 2 lines)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(59, 7, 100);
    const titleLines = pdf.splitTextToSize(node.title || "", textW).slice(0, 2);
    pdf.text(titleLines, left, cy);
    cy += titleLines.length * 10;

    // sub (1 line)
    if (node.sub) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(120, 110, 140);
      pdf.text(pdf.splitTextToSize(node.sub, textW).slice(0, 1), left, cy);
      cy += 10;
    }

    // status pill
    const st = STATUS_STYLE[node.status] || STATUS_STYLE.future;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    const pillW = pdf.getTextWidth(st.label) + 10;
    pdf.setFillColor(st.bg[0], st.bg[1], st.bg[2]);
    pdf.roundedRect(left, cy - 6.5, pillW, 10, 3, 3, "F");
    pdf.setTextColor(st.fg[0], st.fg[1], st.fg[2]);
    pdf.text(st.label, left + 5, cy);
    cy += 13;

    // headcount line
    if (node.hc && node.hc.req > 0) {
      const hire = Math.max(0, node.hc.req - node.hc.have);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(90, 80, 110);
      pdf.text(
        `Req:${node.hc.req}   Have:${node.hc.have}   ${hire > 0 ? "+" + hire + " hire" : "Full"}`,
        left,
        cy
      );
    }
  }

  return pdf;
}

// ─────────────────────────────────────────────────────────────────────────
// Raster fallback (data views: Scorecards / Headcount / History)
// ─────────────────────────────────────────────────────────────────────────

const MAX_SIDE = 8000;
const MAX_AREA = 36_000_000;

function safeRatio(w: number, h: number, desired = 2): number {
  const r = Math.min(desired, MAX_SIDE / w, MAX_SIDE / h, Math.sqrt(MAX_AREA / (w * h)));
  return Math.max(0.4, r);
}

async function toJpegSafe(el: HTMLElement, opts: Parameters<typeof toJpeg>[1]): Promise<string> {
  try {
    return await toJpeg(el, opts);
  } catch {
    return await toJpeg(el, { ...opts, skipFonts: true });
  }
}

async function buildImagePdf(selector: string): Promise<jsPDF> {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error("View not found.");
  const w = Math.max(el.scrollWidth, el.clientWidth);
  const h = Math.max(el.scrollHeight, el.clientHeight);
  const dataUrl = await toJpegSafe(el, {
    backgroundColor: "#ffffff",
    quality: 0.95,
    width: w,
    height: h,
    pixelRatio: safeRatio(w, h),
    style: { width: `${w}px`, height: `${h}px`, overflow: "visible", maxHeight: "none" },
  });
  const pdf = new jsPDF({
    orientation: w >= h ? "landscape" : "portrait",
    unit: "px",
    format: [w, h],
    compress: true,
  });
  pdf.addImage(dataUrl, "JPEG", 0, 0, w, h);
  return pdf;
}

/**
 * Export the currently-visible view to a single-page PDF and trigger a download.
 * Canvas/org-chart views render as true vector (sharp at any zoom); the data
 * views render as a high-quality image. `rf` is only used for canvas views.
 */
export async function exportViewToPdf(
  view: string,
  title: string,
  rf?: ReactFlowInstance | null
): Promise<void> {
  const pdf =
    CANVAS_VIEWS.includes(view) && rf
      ? buildVectorChart(rf, view)
      : await buildImagePdf(".scroll-view");
  saveDoc(pdf, title);
}
