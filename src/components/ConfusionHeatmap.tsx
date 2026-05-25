import React, { useState, useMemo } from "react";
import { Grid, EyeOff, Sparkles, Filter, Info } from "lucide-react";
import { getConfusionMatrix } from "../utils/data";

export default function ConfusionHeatmap() {
  const [hideDiagonal, setHideDiagonal] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{
    actualIdx: number;
    predIdx: number;
    count: number;
  } | null>(null);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const matrix = useMemo(() => getConfusionMatrix(), []);

  // Compute stats
  const totalPredictions = useMemo(() => {
    return matrix.flat().reduce((a, b) => a + b, 0);
  }, [matrix]);

  const totalCorrect = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < 26; i++) {
      correct += matrix[i][i];
    }
    return correct;
  }, [matrix]);

  const rawAccuracy = (totalCorrect / totalPredictions) * 100;

  // Maximum values for normalization
  const maxDiagonal = 700;
  const maxOffDiagonal = 45; // peak typical confusion level

  // Educational insights regarding visual character similarities
  const getSimiliarityInsight = (actual: string, predicted: string) => {
    if (actual === predicted) {
      return `Correct classification: The ANN successfully isolated the distinct geometric signature of '${actual}'.`;
    }
    
    // Custom pairs
    const pair = `${actual}->${predicted}`;
    const reversePair = `${predicted}->${actual}`;

    if (pair === "I->J" || pair === "J->I" || pair === "I->L" || pair === "L->I") {
      return `Vertical Stem Overlap: Standard vertical lines are high-frequency targets for confusion when handwriting curves are loose.`;
    }
    if (pair === "E->F" || pair === "F->E") {
      return `Limb Intersection: Classifying 'E' vs 'F' depends primarily on a single low-area horizontal lower bar, causing high dropout margins.`;
    }
    if (pair === "O->D" || pair === "D->O" || pair === "O->Q" || pair === "Q->O" || pair === "O->C" || pair === "C->O") {
      return `Loop Symmetries: Semicircular curves and bounds easily blend together when letters are written centered in 28x28 grids.`;
    }
    if (pair === "M->N" || pair === "N->M" || pair === "W->M" || pair === "M->W") {
      return `Peak Density: Multiple vertical peaks make it hard for Dense layer weights to extract exact vertical diagonal angles.`;
    }
    if (pair === "U->V" || pair === "V->U" || pair === "Y->V" || pair === "V->Y") {
      return `Vertex Curvature: The steepness of the bottom coordinate convergence determines U/V/Y. Loose sweeps flatten the local gradients.`;
    }
    if (pair === "P->B" || pair === "B->P" || pair === "P->R" || pair === "R->P" || pair === "P->D") {
      return `Loop Count: The presence of a supplementary low-loop or leg constitutes the target differential, making them highly related in pixel arrays.`;
    }
    if (pair === "S->G" || pair === "G->S" || pair === "S->8" || pair === "H->N") {
      return `Continuous boundaries: Curved loops tracking multiple horizontal and vertical offsets generate overlapping weight vectors.`;
    }

    return `Standard structural proximity: Minor pixel offsets in standard stroke densities triggered secondary activation paths.`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="confusion-heatmap-container">
      {/* Heatmap Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-sans font-semibold text-lg text-slate-900 flex items-center gap-2">
            <Grid className="text-indigo-600 w-5.5 h-5.5" />
            26x26 Multiclass Confusion Heatmap
          </h3>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Visual matrix mapping correct diagonal classifications against visual letter co-dependencies.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 self-start md:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-sans text-xs text-slate-600 mr-2 border-r border-slate-200 pr-2">Heatmap Filter</span>
          <button
            onClick={() => setHideDiagonal(!hideDiagonal)}
            className={`font-sans text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              hideDiagonal
                ? "bg-indigo-600 text-white font-medium"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            {hideDiagonal ? "Isolating Errors Only" : "Isolate Grid Errors"}
          </button>
        </div>
      </div>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Heatmap Grid on Left */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50 p-4">
            <div className="min-w-[650px] flex flex-col">
              {/* x Axis Headers */}
              <div className="flex items-center mb-1">
                {/* corner placeholder */}
                <span className="w-8 shrink-0 font-mono text-[10px] text-slate-400 text-center font-bold">Act</span>
                <div className="flex-1 flex justify-between">
                  {alphabet.map((letter) => (
                    <span key={letter} className="w-full text-center font-mono text-[10px] font-bold text-slate-500">
                      {letter}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rows */}
              <div className="space-y-[1px]">
                {alphabet.map((rowLetter, actualIdx) => (
                  <div key={rowLetter} className="flex items-center">
                    {/* Row Header (Y Axis Actual) */}
                    <span className="w-8 shrink-0 font-mono text-[10px] font-bold text-slate-500 text-center mr-1">
                      {rowLetter}
                    </span>

                    {/* Heatmap columns */}
                    <div className="flex-1 flex justify-between gap-[1px]">
                      {alphabet.map((colLetter, predIdx) => {
                        const count = matrix[actualIdx][predIdx];
                        const isDiagonal = actualIdx === predIdx;
                        
                        // Calculate background intensity dynamically
                        let opacity = 0;
                        if (isDiagonal) {
                          opacity = hideDiagonal ? 0 : 0.15 + (count / maxDiagonal) * 0.85;
                        } else {
                          opacity = Math.min(1.0, (count / maxOffDiagonal));
                        }

                        // Determine BG class
                        let bgStyle = {
                          backgroundColor: isDiagonal
                            ? `rgba(79, 70, 229, ${opacity})` // Indigo for diagonal correct predictions
                            : `rgba(244, 63, 94, ${opacity})` // Rose for off-diagonal errors
                        };

                        const isHovered = hoveredCell?.actualIdx === actualIdx && hoveredCell?.predIdx === predIdx;

                        return (
                          <div
                            key={colLetter}
                            onMouseEnter={() => setHoveredCell({ actualIdx, predIdx, count })}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={bgStyle}
                            className={`w-full aspect-square rounded-[1px] cursor-pointer transition-all ${
                              isHovered ? "ring-2 ring-slate-900 scale-125 z-10" : ""
                            }`}
                            title={`Actual: ${rowLetter}, Predicted: ${colLetter}, Count: ${count}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend container */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-indigo-600 rounded-[2px]" />
                    <span className="font-sans text-[10px] text-slate-500">Diagonal (Correct Predictions)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-rose-500 rounded-[2px]" />
                    <span className="font-sans text-[10px] text-slate-500">Off-Diagonal (Confusion Errors)</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  X-Axis: Predicted Alphabet Label → | Y-Axis: Actual EMNIST Alphabet Label ↑
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Tooltip / Analysis on Right */}
        <div className="lg:col-span-1 flex flex-col justify-between">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h4 className="font-sans font-semibold text-xs text-slate-800 uppercase tracking-wider">
                  Interactive Inspector
                </h4>
              </div>

              {hoveredCell ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-slate-150 p-2.5 rounded-lg text-center shadow-xs">
                      <span className="block font-sans text-[10px] text-slate-400 font-medium">ACTUAL LABEL</span>
                      <span className="font-sans text-2xl font-black text-slate-900">
                        {alphabet[hoveredCell.actualIdx]}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-150 p-2.5 rounded-lg text-center shadow-xs">
                      <span className="block font-sans text-[10px] text-slate-400 font-medium">PREDICTED BY ANN</span>
                      <span className="font-sans text-2xl font-black text-indigo-600">
                        {alphabet[hoveredCell.predIdx]}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-xs">
                    <span className="block font-sans text-[10px] text-slate-400 font-medium">CO-OCCURRENCE TALLY</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-sans text-xl font-bold text-slate-950">
                        {hoveredCell.count}
                      </span>
                      <span className="font-sans text-xs text-slate-400">
                        test images
                      </span>
                    </div>
                    <span className="block font-mono text-[9px] text-indigo-500 mt-1">
                      {((hoveredCell.count / 700) * 100).toFixed(1)}% class error footprint
                    </span>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                    <span className="block font-sans text-[10px] font-bold text-indigo-800 tracking-wide mb-1 flex items-center gap-1">
                      <Info className="w-3 h-3 text-indigo-600" />
                      CO-DEPENDENCY CAUSE
                    </span>
                    <p className="font-sans text-[11px] text-slate-600 leading-normal">
                      {getSimiliarityInsight(alphabet[hoveredCell.actualIdx], alphabet[hoveredCell.predIdx])}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Grid className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="font-sans text-[11px] text-slate-400 leading-normal">
                    Hover over any grid tile to analyze misclassification triggers and neural features.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="block font-sans text-[10px] text-slate-400 font-semibold mb-1">
                  GLOBAL ERROR DISTRIBUTION
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-sans text-lg font-bold text-slate-950">
                    {rawAccuracy.toFixed(1)}%
                  </span>
                  <span className="font-sans text-[10px] text-slate-400">
                    Correct predictions average
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full" style={{ width: `${rawAccuracy}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
