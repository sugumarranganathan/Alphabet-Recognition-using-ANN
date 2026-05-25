import React, { useState } from "react";
import { Brain, Sparkles, HelpCircle, GraduationCap, Clock, RefreshCw, Layers, History, ShieldAlert } from "lucide-react";
import DrawCanvas from "./components/DrawCanvas";
import NetworkVisualizer from "./components/NetworkVisualizer";
import ConfusionHeatmap from "./components/ConfusionHeatmap";
import TrainingStats from "./components/TrainingStats";
import { PredictionResult, HistoryItem } from "./types";

export default function App() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [activePixels, setActivePixels] = useState<number[]>(new Array(784).fill(0));
  const [isPredicting, setIsPredicting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Calls the full-stack prediction API proxy
  const handlePredict = async (base64Image: string, pixelArray: number[]) => {
    setIsPredicting(true);
    setErrorNotice(null);
    setActivePixels(pixelArray);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`HTTP network error: status ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPrediction(data);

        // Add to history list (limited to 5 items)
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          letter: data.letter,
          drawnImage: base64Image,
          confidence: data.confidence,
        };
        setHistory((prev) => [newItem, ...prev.slice(0, 4)]);
      } else {
        throw new Error(data.error || "Unknown prediction error");
      }
    } catch (err: any) {
      console.error("Prediction API failed:", err);
      setErrorNotice(err.message || "Failed to contact neural engine server. Check that your dev server is active.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleClearAll = () => {
    setPrediction(null);
    setActivePixels(new Array(784).fill(0));
    setHistory([]);
    setErrorNotice(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-indigo-100" id="main-application-view">
      
      {/* Dynamic Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-black text-xl tracking-tight text-slate-900">
                  EMNIST Letters ANN Classifier
                </h1>
                <span className="font-mono text-[9px] bg-slate-900 border border-slate-800 text-slate-100 rounded px-1.5 py-0.5 select-none font-semibold uppercase">
                  v1.2.0-Production
                </span>
              </div>
              <p className="font-sans text-xs text-slate-500 mt-0.5">
                Interactive Multi-Layer Artificial Neural Network Playground & Classifier.
              </p>
            </div>
          </div>

          {/* Quick Stats Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-mono text-[10px] text-slate-600">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Accuracy: 91%</span>
            </div>
            <button
              onClick={handleClearAll}
              className="py-1 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-sans text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              title="Reset all session states"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Workbench
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        
        {/* Error warning box */}
        {errorNotice && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="block font-sans font-bold text-xs text-red-800">API ROUTING ERROR</span>
              <p className="font-sans text-xs text-red-700 leading-normal mt-0.5">{errorNotice}</p>
            </div>
          </div>
        )}

        {/* Top Section: Interactive Workbench */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left panel: Draw board + history folder (4 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex-1">
              <DrawCanvas
                onPredict={handlePredict}
                isPredicting={isPredicting}
                prediction={prediction}
              />
            </div>

            {/* Test History Drawer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-sans font-medium text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Live Testing Feed
                </h3>
                <p className="font-sans text-[11px] text-slate-500 leading-normal mb-4">
                  History log of letters identified in this browsing session.
                </p>

                {history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border border-slate-100 rounded-xl p-2.5 bg-slate-50/50 hover:bg-slate-50 transition-all font-sans"
                      >
                        <div className="flex items-center gap-3">
                          {/* Saved Drawing */}
                          <div className="w-10 h-10 rounded-md bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                            <img src={item.drawnImage} alt="User stroke" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <span className="block font-sans text-xs font-bold text-slate-800">
                              Classified as uppercase <strong className="text-indigo-600">{item.letter}</strong>
                            </span>
                            <span className="block font-mono text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              Forwarded {item.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Saved confidence score */}
                        <div className="text-right">
                          <span className="block font-mono text-xs font-semibold text-slate-900">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="block text-[8px] text-slate-400 uppercase font-bold mt-0.5">Confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
                    <span className="font-sans text-[11px] text-slate-400">
                      No handwritten metrics accumulated yet.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Layer Activations (7 columns) */}
          <div className="lg:col-span-7">
            <NetworkVisualizer
              prediction={prediction}
              activePixels={activePixels}
            />
          </div>

        </section>

        {/* Divider line */}
        <hr className="border-slate-200" />

        {/* Bottom Section: Analytical Heatmaps and curves */}
        <section className="space-y-8">
          
          {/* Timeline & Curves Dashboard Grid */}
          <TrainingStats />

          {/* Confusion Heatmap Grid */}
          <ConfusionHeatmap />

        </section>

      </main>

      {/* Structured educational Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Layers className="text-slate-400 w-5 h-5" />
            <span className="font-sans text-xs text-slate-500">
              EMNIST Multiclass Recognition (letters) Sandbox (A-Z) | Neural Architectures Review Terminal
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-sans">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Full Stack API Online
            </span>
            <span>Based on TensorFlow Keras Model fit logs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
