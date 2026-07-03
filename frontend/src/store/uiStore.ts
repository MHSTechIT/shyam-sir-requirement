import { create } from "zustand";

interface ConfirmConfig {
  icon?: string;
  title: string;
  msg: string;
  primary?: string;
  danger?: boolean;
  onYes: () => void;
}

interface PdfTarget {
  url: string;
  name: string;
  mimeType: string;
}

interface ColorTarget {
  nodeId: string;
  x: number;
  y: number;
}

interface UiStore {
  sidePanelNodeId: string | null;
  addNodeOpen: boolean;
  pdf: PdfTarget | null;
  confirm: ConfirmConfig | null;
  color: ColorTarget | null;
  fullscreen: boolean;
  groupsOpen: boolean;

  setFullscreen: (v: boolean) => void;
  openGroups: () => void;
  closeGroups: () => void;
  openSidePanel: (id: string) => void;
  closeSidePanel: () => void;
  openAddNode: () => void;
  closeAddNode: () => void;
  openPdf: (t: PdfTarget) => void;
  closePdf: () => void;
  showConfirm: (cfg: ConfirmConfig) => void;
  closeConfirm: () => void;
  openColor: (t: ColorTarget) => void;
  closeColor: () => void;
}

export const useUi = create<UiStore>((set) => ({
  sidePanelNodeId: null,
  addNodeOpen: false,
  pdf: null,
  confirm: null,
  color: null,
  fullscreen: false,
  groupsOpen: false,

  setFullscreen: (v) => set({ fullscreen: v }),
  openGroups: () => set({ groupsOpen: true }),
  closeGroups: () => set({ groupsOpen: false }),
  openSidePanel: (id) => set({ sidePanelNodeId: id }),
  closeSidePanel: () => set({ sidePanelNodeId: null, pdf: null }),
  openAddNode: () => set({ addNodeOpen: true }),
  closeAddNode: () => set({ addNodeOpen: false }),
  openPdf: (pdf) => set({ pdf }),
  closePdf: () => set({ pdf: null }),
  showConfirm: (confirm) => set({ confirm }),
  closeConfirm: () => set({ confirm: null }),
  openColor: (color) => set({ color }),
  closeColor: () => set({ color: null }),
}));
