import React, { useState, useEffect, useMemo } from "react";
import { Cpu, Activity, Info, Zap, Flame, Grid } from "lucide-react";
import { PredictionResult } from "../types";

interface NetworkVisualizerProps {
  prediction: PredictionResult | null;
  activePixels: number[]; // From DrawCanvas (784 indices)
}

export default function NetworkVisualizer({ prediction, activePixels }: NetworkVisualizerProps) {
  const [dropoutRate, setDropoutRate] = useState(0.3);
  const [isDropoutActiveInSim, setIsDropoutActiveInSim] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<{ layer: string; index: number; val: number } | null>(null);

  // Procedural deterministic activations based on drawn pixels or prediction letter
  const selectedLetterIdx = prediction ? prediction.letter.charCodeAt(0) - 65 : -1;

  // Layer size constants
  const LAYER_SIZES = {
    input: 784,
    dense1: 512,
    dense2: 256,
    dense3: 128,
    output: 26,
  };

  // Generate deterministic/coherent node activations for Dense 1, 2, and 3
  // based on the drawn pixels and predicted letter to make the neural firing look authentic.
  const layerActivations = useMemo(() => {
    // Standard random seed generator
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    };

    const makeActivations = (size: number, seed: number, characterFocus: number) => {
      const arr = new Array(size).fill(0);
      const isCharacterDrawn = characterFocus !== -1;

      for (let i = 0; i < size; i++) {
        // Pixel density factor
        const pixelWeightSum = activePixels.slice((i * 10) % 700, ((i * 10) % 700) + 15).reduce((a, b) => a + b, 0);
        let baseVal = (Math.sin(i * 0.15 + seed) + 1) / 2; // base sine noise
        
        // Boost activations matching active features
        baseVal = (baseVal * 0.4) + (pixelWeightSum * 0.15);

        // Character specific activation peaks (representing targeted EMNIST feature extraction)
        if (isCharacterDrawn) {
          const charSpecificPeak = (Math.cos(i * 0.73 + characterFocus * 3.7) + 1) / 2;
          baseVal = (baseVal * 0.3) + (charSpecificPeak * 0.7);
        }

        // Apply simulated non-linear ReLU threshold
        let activation = baseVal > 0.45 ? (baseVal - 0.45) * 1.8 : 0;
        if (activation > 1.0) activation = 1.0;

        arr[i] = Number(activation.toFixed(3));
      }
      return arr;
    };

    const charSeed = selectedLetterIdx !== -1 ? selectedLetterIdx : 42;
    const d1 = makeActivations(LAYER_SIZES.dense1, 101 + charSeed, selectedLetterIdx);
    const d2 = makeActivations(LAYER_SIZES.dense2, 202 + charSeed, selectedLetterIdx);
    const d3 = makeActivations(LAYER_SIZES.dense3, 303 + charSeed, selectedLetterIdx);

    return { dense1: d1, dense2: d2, dense3: d3 };
  }, [selectedLetterIdx, activePixels]);

  // Handle simulated dropout masks
  // Generates boolean array representing which nodes are "ON" (true) or "DROPPED" (false)
  const dropoutMasks = useMemo(() => {
    const makeMask = (size: number, rate: number, isActive: boolean) => {
      const mask = new Array(size).fill(true);
      if (!isActive) return mask;
      for (let i = 0; i < size; i++) {
        // Stable pseudorandom dropout per coordinate index
        const rand = (Math.sin(i * 4529.13) + 1) / 2;
        if (rand < rate) {
          mask[i] = false;
        }
      }
      return mask;
    };

    return {
      dense1: makeMask(LAYER_SIZES.dense1, dropoutRate, isDropoutActiveInSim),
      dense2: makeMask(LAYER_SIZES.dense2, dropoutRate, isDropoutActiveInSim),
      dense3: makeMask(LAYER_SIZES.dense3, dropoutRate, isDropoutActiveInSim),
    };
  }, [dropoutRate, isDropoutActiveInSim]);

  // Helper variables for Output Layer
  // Map characters
  const labelsCount = 26;
  const letterLabels = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  const finalProbabilities = useMemo(() => {
    if (prediction && prediction.probabilities) {
      return prediction.probabilities;
    }
    // Default uniform rest state
    return new Array(26).fill(0).map(() => 0.038);
  }, [prediction]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="network-visualizer-container">
      {/* Visualizer header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-sans font-semibold text-lg text-slate-900 flex items-center gap-2">
            <Cpu className="text-indigo-600 w-5.5 h-5.5" />
            ANN Forward-Propagation Stack
          </h3>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Real-time simulation of active neurons, weights flow, and Dropout sweeps.
          </p>
        </div>

        {/* Dropout training emulator */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dropout-toggle"
              checked={isDropoutActiveInSim}
              onChange={() => setIsDropoutActiveInSim(!isDropoutActiveInSim)}
              className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="dropout-toggle" className="font-sans text-xs font-semibold text-slate-700 cursor-pointer select-none flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Simulate Dropout (Training Mode)
            </label>
          </div>

          {isDropoutActiveInSim && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="font-mono text-[10px] text-slate-500">Rate: {(dropoutRate * 100).toFixed(0)}%</span>
              <input
                type="range"
                min={0.1}
                max={0.5}
                step={0.1}
                value={dropoutRate}
                onChange={(e) => setDropoutRate(Number(e.target.value))}
                className="w-16 accent-amber-500 h-1 cursor-pointer rounded-lg bg-slate-200 appearance-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main visualization grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mt-6 items-start">
        {/* Networks Columns (Dense 1 to 3) */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Dense Layer 1 (512 Nodes) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Dense Layer 1 (512 Neurons, ReLU)
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Shape: (784, 512) | Params: 401,920
              </span>
            </div>

            {/* Rep 16x32 Grid of Nodes */}
            <div className="grid grid-cols-32 gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 shadow-inner">
              {layerActivations.dense1.map((act, idx) => {
                const isActive = dropoutMasks.dense1[idx];
                const intensity = isActive ? act : 0;
                const isHovered = hoveredNode?.layer === "dense1" && hoveredNode?.index === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredNode({ layer: "dense1", index: idx, val: act })}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`aspect-square rounded-[2px] transition-all cursor-pointer relative ${
                      isHovered ? "ring-2 ring-white scale-110 z-10" : ""
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? `rgba(99, 102, 241, ${0.12 + intensity * 0.88})`
                        : "rgba(239, 68, 68, 0.25)", // dropped is red-fade
                      boxShadow: isActive && intensity > 0.4
                        ? `0 0 4px rgba(99, 102, 241, ${intensity})`
                        : "none"
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Dense Layer 2 (256 Nodes) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Dense Layer 2 (256 Neurons, ReLU)
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Shape: (512, 256) | Params: 131,328
              </span>
            </div>

            {/* Rep 16x16 Grid of Nodes */}
            <div className="grid grid-cols-16 gap-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 shadow-inner max-w-md mx-auto">
              {layerActivations.dense2.map((act, idx) => {
                const isActive = dropoutMasks.dense2[idx];
                const intensity = isActive ? act : 0;
                const isHovered = hoveredNode?.layer === "dense2" && hoveredNode?.index === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredNode({ layer: "dense2", index: idx, val: act })}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`aspect-square rounded-[2px] transition-all cursor-pointer relative ${
                      isHovered ? "ring-2 ring-white scale-110 z-10" : ""
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? `rgba(139, 92, 246, ${0.12 + intensity * 0.88})` // purple tint
                        : "rgba(239, 68, 68, 0.25)",
                      boxShadow: isActive && intensity > 0.4
                        ? `0 0 4px rgba(139, 92, 246, ${intensity})`
                        : "none"
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Dense Layer 3 (128 Nodes) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-indigo-600 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Dense Layer 3 (128 Neurons, ReLU)
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Shape: (256, 128) | Params: 32,896
              </span>
            </div>

            {/* Rep 16x8 Grid of Nodes */}
            <div className="grid grid-cols-16 gap-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800 shadow-inner max-w-md mx-auto">
              {layerActivations.dense3.map((act, idx) => {
                const isActive = dropoutMasks.dense3[idx];
                const intensity = isActive ? act : 0;
                const isHovered = hoveredNode?.layer === "dense3" && hoveredNode?.index === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredNode({ layer: "dense3", index: idx, val: act })}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`aspect-square rounded-[2px] transition-all cursor-pointer relative ${
                      isHovered ? "ring-2 ring-white scale-110 z-10" : ""
                    }`}
                    style={{
                      backgroundColor: isActive
                        ? `rgba(236, 72, 153, ${0.12 + intensity * 0.88})` // pink tint
                        : "rgba(239, 68, 68, 0.25)",
                      boxShadow: isActive && intensity > 0.4
                        ? `0 0 4px rgba(236, 72, 153, ${intensity})`
                        : "none"
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Node Hover Tooltip Info */}
          <div className="h-10 border border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 px-4">
            {hoveredNode ? (
              <span className="font-mono text-[11px] text-slate-700 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                Active Unit: Layer: <strong className="uppercase">{hoveredNode.layer}</strong> | Index: <strong className="text-slate-900">#{hoveredNode.index}</strong> | Activation: <strong className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{hoveredNode.val.toFixed(3)}</strong>
                {!dropoutMasks[hoveredNode.layer as "dense1" | "dense2" | "dense3"]?.[hoveredNode.index] && (
                  <span className="text-red-500 font-bold bg-red-50 rounded ml-2 px-1 text-[9px]">⚠️ DROPPED OUT</span>
                )}
              </span>
            ) : (
              <span className="font-sans text-[10px] text-slate-400 italic">
                Hover over any neural node above to dynamically inspect feature extraction rates and connection status map.
              </span>
            )}
          </div>
        </div>

        {/* Dense Output Column (Softmax Categorization 26 Nodes) */}
        <div className="xl:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4 h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <span className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Output (26 Softmax, A-Z)
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Params: 3,354
              </span>
            </div>

            {/* Top class highlights */}
            {prediction && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[10px] font-bold text-emerald-800">
                    CLASSIFIER DECISION
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded uppercase">
                    Index #{prediction.letter.charCodeAt(0) - 65}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-sans text-2xl font-black text-emerald-950">
                    Letter {prediction.letter}
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-700">
                    (p = {prediction.confidence.toFixed(3)})
                  </span>
                </div>
              </div>
            )}

            {/* Scrollable list of 26 alphabet probabilities */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {letterLabels.map((lbl, idx) => {
                const prob = finalProbabilities[idx] || 0;
                const isWinner = selectedLetterIdx === idx;

                return (
                  <div
                    key={lbl}
                    className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${
                      isWinner ? "bg-indigo-600/10 border border-indigo-200" : "hover:bg-slate-100/50"
                    }`}
                  >
                    {/* Circle Node visualizer */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-sans text-xs font-bold shrink-0 transition-all ${
                        isWinner
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                      style={{
                        backgroundColor: !isWinner && prob > 0.1 ? `rgba(99, 102, 241, ${prob})` : undefined,
                        color: !isWinner && prob > 0.15 ? "#ffffff" : undefined
                      }}
                    >
                      {lbl}
                    </div>

                    {/* Progress track */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                        <span>Index {idx}</span>
                        <span className={isWinner ? "text-indigo-600 font-bold" : "text-slate-600"}>
                          {prob.toFixed(4)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${isWinner ? "bg-indigo-600" : "bg-indigo-400"}`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="font-sans text-[10px] text-slate-500 leading-relaxed leading-normal">
              <strong>Softmax function</strong> normalizes the raw neural outputs into a probability distribution summing precisely to 1.0.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
