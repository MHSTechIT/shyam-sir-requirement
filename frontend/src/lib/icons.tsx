import {
  Globe,
  LayoutDashboard,
  ClipboardList,
  History,
  Settings,
  Pill,
  Building2,
  Code2,
  Megaphone,
  Video,
  Handshake,
  CheckCircle2,
  Search,
  MapPin,
  Clock,
  type LucideIcon,
} from "lucide-react";

// Icon for each top-level view / nav item.
export const VIEW_ICONS: Record<string, LucideIcon> = {
  master: Globe,
  scorecard: LayoutDashboard,
  table: ClipboardList,
  history: History,
};

// Icon for each scorecard block.
export const SCORECARD_ICONS: Record<string, LucideIcon> = {
  all: Globe,
  ops: Settings,
  wc: Pill,
  an: Building2,
  kum: Building2,
  dev: Code2,
  mkt: Megaphone,
  vsl: Video,
  col: Handshake,
};

// Icon + label for each node status.
export const STATUS_META: Record<
  string,
  { icon: LucideIcon; label: string; cls: string }
> = {
  active: { icon: CheckCircle2, label: "Active", cls: "ntag-active" },
  hiring: { icon: Search, label: "Hiring", cls: "ntag-hiring" },
  future: { icon: MapPin, label: "Future", cls: "ntag-future" },
  notice: { icon: Clock, label: "Notice", cls: "ntag-notice" },
};
