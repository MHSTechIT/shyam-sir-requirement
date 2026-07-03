import { FileText, X } from "lucide-react";
import { useUi } from "../store/uiStore";

export function PdfPreview() {
  const pdf = useUi((s) => s.pdf);
  const close = useUi((s) => s.closePdf);

  return (
    <div id="pdf-preview-panel" className={pdf ? "show" : ""}>
      <div className="pdf-header">
        <span className="pdf-title">{pdf?.name || "Document Preview"}</span>
        <button className="tb-btn" onClick={close}><X size={14} /></button>
      </div>
      <div className="pdf-body">
        {pdf &&
          (pdf.mimeType.includes("image") ? (
            <img src={pdf.url} alt={pdf.name} />
          ) : pdf.mimeType.includes("pdf") ? (
            <iframe src={pdf.url} title={pdf.name} />
          ) : (
            <div style={{ padding: 40, textAlign: "center", background: "#fff", color: "#333", borderRadius: 6 }}>
              <div style={{ display: "flex", justifyContent: "center", color: "#6d28d9" }}>
                <FileText size={48} />
              </div>
              <h3 style={{ margin: "12px 0" }}>{pdf.name}</h3>
              <p style={{ color: "#666", marginBottom: 20 }}>Preview not available for this file type.</p>
              <a
                href={pdf.url}
                download={pdf.name}
                style={{ background: "#6c63ff", color: "#fff", padding: "8px 16px", borderRadius: 6, textDecoration: "none" }}
              >
                Download to view
              </a>
            </div>
          ))}
      </div>
    </div>
  );
}
