import { useEffect, useRef } from "react";
import { type ReactFlowState, useStore } from "@xyflow/react";

// SVG/canvas overlay that draws the vertical/horizontal alignment guides while
// a node is being dragged. Ported from the official React Flow example.

type Props = {
  horizontal?: number;
  vertical?: number;
  color?: string;
};

const storeSelector = (s: ReactFlowState) => ({
  width: s.width,
  height: s.height,
  transform: s.transform,
});

export function HelperLines({ horizontal, vertical, color = "#7c3aed" }: Props) {
  const { width, height, transform } = useStore(storeSelector);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpi = window.devicePixelRatio || 1;
    canvas.width = width * dpi;
    canvas.height = height * dpi;
    ctx.scale(dpi, dpi);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const [tx, ty, zoom] = transform;

    if (typeof vertical === "number") {
      const x = vertical * zoom + tx;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    if (typeof horizontal === "number") {
      const y = horizontal * zoom + ty;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [width, height, transform, horizontal, vertical, color]);

  return (
    <canvas
      ref={canvasRef}
      className="helper-lines"
      style={{
        width,
        height,
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}
