import React, { useState } from "react";
import { Brain, GraduationCap, Clock, RefreshCw, Layers, History, ShieldAlert } from "lucide-react";
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
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPrediction(data);

        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2,9),
          timestamp: new Date().toLocaleTimeString(),
          letter: data.letter,
          drawnImage: base64Image,
          confidence: data.confidence
        };

        setHistory(prev => [newItem, ...prev.slice(0,4)]);
      }
    } catch (err:any) {
      setErrorNotice(
        "Prediction service unavailable"
      );
    }

    setIsPredicting(false);
  };

  const handleClearAll = () => {
    setPrediction(null);
    setActivePixels(new Array(784).fill(0));
    setHistory([]);
    setErrorNotice(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between">

          <div className="flex gap-3 items-center">

            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Brain className="w-6 h-6"/>
            </div>

            <div>
              <div className="flex gap-2 items-center">

                <h1 className="font-black text-xl">
                  AlphaRecogAI
                </h1>

                <span className="text-[9px] bg-slate-900 text-white rounded px-2 py-1">
                  ANN MODEL
                </span>

              </div>

              <p className="text-xs text-slate-500">
                Handwritten Alphabet Recognition using Artificial Neural Network
              </p>

            </div>

          </div>

          <div className="flex gap-2">

            <div className="bg-slate-100 px-3 py-1 rounded-full text-[11px] flex items-center gap-1">
              <GraduationCap className="w-3 h-3"/>
              Accuracy: 91%
            </div>

            <button
              onClick={handleClearAll}
              className="border rounded-full px-3 py-1 text-[11px] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3"/>
              Clear Results
            </button>

          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {errorNotice && (
          <div className="bg-red-50 border border-red-300 p-4 rounded-xl mb-5">
            <div className="flex gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500"/>
              <span>{errorNotice}</span>
            </div>
          </div>
        )}

        <section className="grid lg:grid-cols-12 gap-8">

          <div className="lg:col-span-5 flex flex-col gap-5">

            <DrawCanvas
              onPredict={handlePredict}
              isPredicting={isPredicting}
              prediction={prediction}
            />

            <div className="bg-white rounded-xl border p-5">

              <h3 className="text-xs uppercase flex gap-2 items-center">
                <History className="w-4 h-4"/>
                Prediction History
              </h3>

              <p className="text-[11px] text-slate-500 mb-3">
                Recent recognized letters
              </p>

              {history.length===0 ?
              (
                <div className="text-center text-xs text-slate-400 py-5">
                  No predictions available
                </div>
              )
              :
              (
                history.map(item=>(
                  <div
                  key={item.id}
                  className="flex justify-between border p-2 rounded-lg mb-2"
                  >
                    <div>
                      Letter:
                      <strong> {item.letter}</strong>
                    </div>

                    <div>
                      {(item.confidence*100).toFixed(0)}%
                    </div>
                  </div>
                ))
              )}

            </div>

          </div>

          <div className="lg:col-span-7">
            <NetworkVisualizer
              prediction={prediction}
              activePixels={activePixels}
            />
          </div>

        </section>

        <hr className="my-8"/>

        <TrainingStats/>
        <ConfusionHeatmap/>

      </main>

      <footer className="bg-white border-t py-5 mt-8">

        <div className="max-w-7xl mx-auto flex justify-between">

          <div className="flex gap-2 items-center">

            <Layers className="w-4 h-4"/>

            <span className="text-xs">
              Alphabet Recognition (A-Z) using ANN
            </span>

          </div>

          <span className="text-xs text-slate-500">
            TensorFlow Keras Neural Network Model
          </span>

        </div>

      </footer>

    </div>
  );
}
