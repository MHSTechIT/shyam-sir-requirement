import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

// NOTE: React.StrictMode is intentionally omitted. Its dev-only double-mount
// tears down React Flow v12's ResizeObserver, leaving nodes unmeasured and
// edges unrendered. Production behaves identically with or without it.
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
