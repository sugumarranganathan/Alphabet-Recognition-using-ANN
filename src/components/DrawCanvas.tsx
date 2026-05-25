import React, { useRef, useState, useEffect } from "react";
import { Trash2, Undo, Eye, CheckCircle2, ChevronRight, Activity, HelpCircle } from "lucide-react";
import { PredictionResult } from "../types";

interface DrawCanvasProps {
  onPredict: (base64Image: string, pixelArray: number[]) => Promise<void>;
  isPredicting: boolean;
  prediction: PredictionResult | null;
}

export default function DrawCanvas({ onPredict, isPredicting, prediction }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(14);
  const [emnistMode, setEmnistMode] = useState(false);
  const [strokes, setStrokes] = useState<ImageData[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  // Unrolled 784-input micro array state for live feedback
  const [activePixels, setActivePixels] = useState<number[]>(new Array(784).fill(0));

  // Initialize main canvas to 280x280 (rendered scaled up)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Fill canvas with deep chalkboard black/charcoal
        ctx.fillStyle = "#0f172a"; // Slate-900
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Sync canvas to 28x28 intermediate view and unroll pixels
  const updatePixelArrayAndPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary downscaled 28x28 canvas context
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw full canvas scaled down to 28x28
    tempCtx.drawImage(canvas, 0, 0, 28, 28);
    const imgData = tempCtx.getImageData(0, 0, 28, 28);
    const data = imgData.data;

    // Calculate grayscale floating values (0.0 to 1.0)
    const grayInputs = new Array(784).fill(0);
    let hasDrawnPixels = false;

    for (let i = 0; i < 784; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      // Formula matches standard chalkboard luminance exclusion
      // Canvas background is slate-900 (r=15, g=23, b=42)
      // We look at brightness relative to black (0,0,0) or dark slate
      const avg = (r + g + b) / 3;
      
      // Calculate normalized value above background slate-900 threshold
      let normalized = (avg - 26) / (255 - 26);
      if (normalized < 0.05) normalized = 0;
      if (normalized > 1.0) normalized = 1.0;

      grayInputs[i] = normalized;

      if (normalized > 0.15) {
        hasDrawnPixels = true;
      }
    }

    setActivePixels(grayInputs);
    setIsEmpty(!hasDrawnPixels);

    // Update EMNIST Rotated & Flipped Preview canvas
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const pCtx = previewCanvas.getContext("2d");
      if (pCtx) {
        // Clear EMNIST view
        pCtx.fillStyle = "#0f172a";
        pCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // EMNIST rotates 90 degrees CCW (which maps directly during array transpositions (x, y) => (y, x))
        // And mirrors horizontally. Let's render this directly!
        const pImgData = pCtx.createImageData(28, 28);
        for (let y = 0; y < 28; y++) {
          for (let x = 0; x < 28; x++) {
            // Standard index in 28x28 original row-major
            const srcIdx = y * 28 + x;
            
            // EMNIST transposition equivalent:
            // Transpose (y, x) -> standard flip operation in NumPy
            // To simulate EMNIST transposed orientation: Let's map target coordinates
            // targetX = y, targetY = 27 - x
            const destX = y;
            const destY = 27 - x;
            const destIdx = destY * 28 + destX;

            const val = Math.floor(grayInputs[srcIdx] * 255);
            
            // If emnistMode toggle is active, we write the EMNIST coordinates; otherwise standard coordinates
            const writeIdx = emnistMode ? destIdx : srcIdx;

            pImgData.data[writeIdx * 4] = val;         // R
            pImgData.data[writeIdx * 4 + 1] = val;     // G
            pImgData.data[writeIdx * 4 + 2] = val;     // B
            pImgData.data[writeIdx * 4 + 3] = 255;     // A
          }
        }
        pCtx.putImageData(pImgData, 0, 0);
      }
    }
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Store state before new action for undo operation
    const currentImData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokes((prev) => [...prev.slice(-19), currentImData]); // Limit history array size

    setIsDrawing(true);
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = "#f8fafc"; // bright white brush

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Prevent scrolling when drawing on touch screens
    if ("touches" in e) {
      e.preventDefault();
    }

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    updatePixelArrayAndPreview();
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setStrokes([]);
        updatePixelArrayAndPreview();
      }
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const previous = strokes[strokes.length - 1];
        ctx.putImageData(previous, 0, 0);
        setStrokes((prev) => prev.slice(0, -1));
        updatePixelArrayAndPreview();
      }
    }
  };

  const triggerPrediction = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty || isPredicting) return;

    // Extract drawing from rotated/flipped EMNIST preview canvas for maximum neural authenticity!
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const base64Data = previewCanvas.toDataURL("image/png");
    await onPredict(base64Data, activePixels);
  };

  const activePixelCount = activePixels.filter(p => p > 0.1).length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-full" id="draw-canvas-container">
      {/* Draw Left half */}
      <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 min-h-[460px]">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans font-medium tracking-tight text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Draw Canvas (A to Z)
            </h3>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-md p-1">
              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="p-1.5 rounded text-xs text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-40 transition-all font-sans flex items-center gap-1"
                title="Undo last stroke"
              >
                <Undo className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 rounded text-xs text-red-500 hover:bg-red-50 transition-all font-sans flex items-center gap-1"
                title="Clear chalkboard"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive drawing stage */}
          <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-xl border border-slate-200 overflow-hidden shadow-inner cursor-crosshair">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              onMouseDown={handleStartDraw}
              onMouseMove={handleDraw}
              onMouseUp={handleStopDraw}
              onMouseLeave={handleStopDraw}
              onTouchStart={handleStartDraw}
              onTouchMove={handleDraw}
              onTouchEnd={handleStopDraw}
              className="w-full h-full block"
            />
            {isEmpty && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
                <p className="font-sans text-xs text-slate-400">
                  Write any uppercase letter here
                </p>
                <p className="font-sans text-[10px] text-slate-500 mt-1 italic">
                  Keep it centered for optimal learning results
                </p>
              </div>
            )}
          </div>

          {/* Brush controller */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-mono text-slate-500 mb-1">
              <span>Brush Stroke: {brushSize}px</span>
              <span>Input: 28x28 (784 dimensions)</span>
            </div>
            <input
              type="range"
              min={8}
              max={24}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClear}
            disabled={isEmpty}
            className="flex-1 py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-500 text-slate-700 rounded-xl font-sans text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 disabled:hover:text-slate-700 disabled:cursor-not-allowed"
            title="Clear canvas for next drawing"
          >
            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
            Clear
          </button>
          
          <button
            onClick={triggerPrediction}
            disabled={isEmpty || isPredicting}
            className="flex-[2] py-2.5 px-4 bg-slate-900 border border-slate-900 hover:bg-indigo-600 hover:border-indigo-600 text-white rounded-xl font-sans text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-sm disabled:bg-slate-100 disabled:border-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {isPredicting ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-indigo-400" />
                Analyzing layers...
              </>
            ) : (
              <>
                Predict Character
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Network Prep Right half */}
      <div className="flex-1 p-6 bg-slate-50 flex flex-col justify-between min-h-[460px]">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-sans font-medium text-xs text-slate-600 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-slate-400" />
              ANN Ingestion Pipeline
            </h4>
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-sm">
              <label className="text-[10px] font-sans text-slate-500 cursor-pointer select-none">
                EMNIST View
              </label>
              <input
                type="checkbox"
                checked={emnistMode}
                onChange={() => setEmnistMode(!emnistMode)}
                className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            {/* Visualizer showing 28x28 grayscale map */}
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
              <canvas
                ref={previewCanvasRef}
                width={28}
                height={28}
                className="w-full aspect-square max-w-[100px] border border-slate-700 rounded bg-slate-950 image-render-pixelative"
                style={{ imageRendering: "pixelated" }}
              />
              <span className="font-mono text-[9px] text-slate-400 mt-2">
                {emnistMode ? "EMNIST Array View" : "28x28 Input Array"}
              </span>
            </div>

            {/* Explanatory notes */}
            <div className="space-y-2">
              <p className="font-sans text-[11px] text-slate-600 leading-normal">
                {emnistMode ? (
                  <>
                    <strong className="text-indigo-600">Transposed & Flipped:</strong> EMNIST dataset standardizes letters rotated 90° CCW and flipped horizontally. Clicking prediction sends this format to the ANN!
                  </>
                ) : (
                  <>
                    <strong className="text-slate-700">Native Drawing:</strong> The input canvas is downsampled from 280x280 coordinates down to a dense 28x28 array of floating point light intensities.
                  </>
                )}
              </p>
              <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
                <p className="font-sans text-[10px] text-indigo-800 leading-normal flex items-start gap-1">
                  <HelpCircle className="w-3 h-3 mt-0.5 shrink-0" />
                  EMNIST labels maps 1–26 to alphabet index 0–25.
                </p>
              </div>
            </div>
          </div>

          {/* Micro 784 bar grid */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>Unrolled Input Array X_Input (784 px)</span>
              <span>{activePixelCount} active features</span>
            </div>
            <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-[1px] bg-slate-900 duration-300 p-1 rounded-lg border border-slate-800">
              {activePixels.map((intensity, index) => (
                <div
                  key={index}
                  className="aspect-square transition-all duration-150"
                  style={{
                    backgroundColor: `rgba(99, 102, 241, ${intensity})`,
                    border: intensity > 0 ? "1px solid rgba(255,255,255,0.15)" : "none"
                  }}
                  title={`X[${index}] = ${intensity.toFixed(2)}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Prediction report widget */}
        <div className="mt-5 pt-3 border-t border-slate-100">
          {prediction ? (
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans font-medium text-xs text-slate-800">
                      Prediction Output
                    </span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold uppercase">
                      Letter {prediction.letter}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-sans text-xl font-bold tracking-tight text-slate-950">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="font-sans text-[10px] text-slate-400">
                      Softmax confidence
                    </span>
                  </div>

                  <p className="font-sans text-[11px] text-slate-500 mt-1 leading-normal italic">
                    "{prediction.interpretation}"
                  </p>

                  {prediction.isDemo && (
                    <div className="mt-2 text-[10px] font-mono text-amber-600 bg-amber-50 rounded border border-amber-100 p-1.5">
                      ⚠️ Sandbox Mode Fallback active. Add a GEMINI_API_KEY in Secrets for standard human-grade AI OCR.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[76px] flex items-center justify-center border border-dashed border-slate-200 rounded-xl">
              <span className="font-sans text-[11px] text-slate-400">
                Awaiting input drawing triggers...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
