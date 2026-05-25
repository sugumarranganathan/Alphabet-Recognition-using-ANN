import React, { useState, useMemo } from "react";
import { TrendingUp, Award, PlayCircle, HelpCircle, Users, ArrowUpRight, Search, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import { TRAINING_HISTORY, CLASSIFICATION_REPORT } from "../utils/data";
import { ClassMetric } from "../types";

export default function TrainingStats() {
  const [selectedEpoch, setSelectedEpoch] = useState(10);
  const [activeTab, setActiveTab] = useState<"curves" | "report" | "analogy">("curves");
  
  // Classification Report Table states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof ClassMetric | "">("f1Score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter and Sort CLASSIFICATION_REPORT
  const sortedReport = useMemo(() => {
    let report = [...CLASSIFICATION_REPORT];
    if (searchTerm.trim() !== "") {
      report = report.filter(item => item.letter.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortBy !== "") {
      report.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        
        if (typeof valA === "string" && typeof valB === "string") {
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
        return 0;
      });
    }
    return report;
  }, [searchTerm, sortBy, sortOrder]);

  const handleSort = (field: keyof ClassMetric) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // SVG dimensions for curves plotting
  const svgW = 500;
  const svgH = 220;
  const padding = 34;

  const getAccuracyPoints = () => {
    const data = TRAINING_HISTORY;
    const axPoints = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (svgW - padding * 2);
      // Accuracy maps from 0.0 (bottom) to 1.0 (top)
      const y = svgH - padding - d.accuracy * (svgH - padding * 2);
      return `${x},${y}`;
    }).join(" ");
    
    const valAxPoints = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (svgW - padding * 2);
      const y = svgH - padding - d.valAccuracy * (svgH - padding * 2);
      return `${x},${y}`;
    }).join(" ");

    return { axPoints, valAxPoints };
  };

  const getLossPoints = () => {
    const data = TRAINING_HISTORY;
    const lossPoints = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (svgW - padding * 2);
      // Loss maps from 0.0 to 1.5
      const y = svgH - padding - (d.loss / 1.5) * (svgH - padding * 2);
      return `${x},${y}`;
    }).join(" ");

    const valLossPoints = data.map((d, index) => {
      const x = padding + (index / (data.length - 1)) * (svgW - padding * 2);
      const y = svgH - padding - (d.valLoss / 1.5) * (svgH - padding * 2);
      return `${x},${y}`;
    }).join(" ");

    return { lossPoints, valLossPoints };
  };

  const points = useMemo(() => getAccuracyPoints(), []);
  const lossPts = useMemo(() => getLossPoints(), []);

  // Student list for interactive Dropout simulator
  const activeEpochData = TRAINING_HISTORY[selectedEpoch - 1] || TRAINING_HISTORY[9];

  // Simulated student grid
  const initialStudents = [
    { id: 1, name: "Student 1", role: "Primary Vertical", isDropped: false },
    { id: 2, name: "Student 2", role: "Bottom Curves", isDropped: true },
    { id: 3, name: "Student 3", role: "Triangle Apex", isDropped: false },
    { id: 4, name: "Student 4", role: "Central Crossed Bars", isDropped: false },
    { id: 5, name: "Student 5", role: "Secondary Stems", isDropped: true },
    { id: 6, name: "Student 6", role: "Horizontal Roof", isDropped: false },
    { id: 7, name: "Student 7", role: "Diagonal Slope", isDropped: false },
    { id: 8, name: "Student 8", role: "Symmetric Widths", isDropped: true },
    { id: 9, name: "Student 9", role: "Boundary Oval", isDropped: false },
    { id: 10, name: "Student 10", role: "Mid Intersection", isDropped: false },
    { id: 11, name: "Student 11", role: "Angled receptive", isDropped: true },
    { id: 12, name: "Student 12", role: "Centroid loop", isDropped: false },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="training-stats-container">
      {/* Tab Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h3 className="font-sans font-semibold text-lg text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-indigo-600 w-5.5 h-5.5" />
            Empirical ANN Model Analytics Dashboard
          </h3>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Explore training curves, check out class statistics, and master Dropout neural mechanics.
          </p>
        </div>

        {/* Dashboard Tabs Toggle */}
        <div className="flex space-x-1 bg-slate-150 p-1 rounded-xl self-start lg:self-auto">
          <button
            onClick={() => setActiveTab("curves")}
            className={`font-sans text-xs px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "curves"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            History Curves
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`font-sans text-xs px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "report"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            F1 ledger Report
          </button>
          <button
            onClick={() => setActiveTab("analogy")}
            className={`font-sans text-xs px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "analogy"
                ? "bg-white text-slate-900 font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Dropout Analogy
          </button>
        </div>
      </div>

      {/* Tab: Curves Panel */}
      {activeTab === "curves" && (
        <div className="mt-6 flex flex-col gap-6">
          {/* Epoch Slider Timeline */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="text-indigo-600 w-5 h-5 shrink-0" />
                <div>
                  <span className="font-sans text-xs font-bold text-slate-800">Training Timeline Epoch: #{selectedEpoch} / 10</span>
                  <p className="font-sans text-[11px] text-slate-500 leading-normal">
                    Drag elements along the 10-epoch grid to view parameters converge over training steps.
                  </p>
                </div>
              </div>

              {/* Slider Input */}
              <div className="flex-1 max-w-sm sm:pl-4">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={selectedEpoch}
                  onChange={(e) => setSelectedEpoch(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                  <span>Epoch 1</span>
                  <span>Epoch 5</span>
                  <span>Epoch 10</span>
                </div>
              </div>
            </div>

            {/* Live Indicators based on selected Epoch */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="bg-white p-3 rounded-xl border border-slate-150">
                <span className="block font-sans text-[10px] text-slate-400 font-bold">ACCURACY (TRAIN)</span>
                <span className="font-mono text-xl font-black text-indigo-600">{(activeEpochData.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-150">
                <span className="block font-sans text-[10px] text-slate-400 font-bold">ACCURACY (VAL/TEST)</span>
                <span className="font-mono text-xl font-black text-indigo-500">{(activeEpochData.valAccuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-150">
                <span className="block font-sans text-[10px] text-slate-400 font-bold">CATEGORICAL LOSS</span>
                <span className="font-mono text-xl font-black text-rose-500">{activeEpochData.loss.toFixed(3)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-150">
                <span className="block font-sans text-[10px] text-slate-400 font-bold">VAL LOSS</span>
                <span className="font-mono text-xl font-black text-rose-400">{activeEpochData.valLoss.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Dual SVGs Curve Plots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accuracy Svg */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3 border-b border-slate-150 pb-2">
                <span className="font-sans text-xs font-bold text-slate-800">Model Learning Accuracy Curve</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-0.5 bg-indigo-600" />
                    <span className="text-[10px] text-slate-500">Train</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-0.5 bg-blue-400 stroke-dasharray-[3,3]" style={{ borderTop: "2px dashed #60a5fa" }} />
                    <span className="text-[10px] text-slate-500">Test (Val)</span>
                  </div>
                </div>
              </div>

              <div className="relative w-full aspect-[500/220]">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
                  {/* Grid lines */}
                  {Array.from({ length: 6 }, (_, idx) => {
                    const yVal = padding + (idx / 5) * (svgH - padding * 2);
                    const label = (1.0 - (idx / 5)).toFixed(1);
                    return (
                      <g key={idx}>
                        <line x1={padding} y1={yVal} x2={svgW - padding} y2={yVal} className="stroke-slate-200 stroke-[0.75]" />
                        <text x={padding - 6} y={yVal + 3} className="fill-slate-400 font-mono text-[9px] text-right" textAnchor="end">{label}</text>
                      </g>
                    );
                  })}
                  {/* X Axis label coordinates */}
                  {TRAINING_HISTORY.map((d, index) => {
                    const x = padding + (index / 9) * (svgW - padding * 2);
                    return (
                      <g key={index}>
                        <line x1={x} y1={svgH - padding} x2={x} y2={padding} className="stroke-slate-200 stroke-[0.75] stroke-dasharray-[1,4]" />
                        <text x={x} y={svgH - padding + 12} className="fill-slate-400 font-mono text-[8px] text-center" textAnchor="middle">e{index+1}</text>
                        {/* Selector indicator */}
                        {index + 1 === selectedEpoch && (
                          <circle cx={x} cy={svgH - padding - d.valAccuracy * (svgH - padding * 2)} r="4" className="fill-indigo-600 stroke-white stroke-2 animate-ping" />
                        )}
                      </g>
                    );
                  })}

                  {/* Draw Paths */}
                  <polyline fill="none" stroke="#4f46e5" strokeWidth="2.5" points={points.axPoints} />
                  <polyline fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="3,3" points={points.valAxPoints} />
                </svg>
              </div>
            </div>

            {/* Loss Svg */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3 border-b border-slate-150 pb-2">
                <span className="font-sans text-xs font-bold text-slate-800">Model Cross-Entropy Loss Curve</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-0.5 bg-rose-500" />
                    <span className="text-[10px] text-slate-500">Train</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-0.5" style={{ borderTop: "2px dashed #f43f5e" }} />
                    <span className="text-[10px] text-slate-500">Test (Val)</span>
                  </div>
                </div>
              </div>

              <div className="relative w-full aspect-[500/220]">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
                  {/* Grid lines */}
                  {Array.from({ length: 4 }, (_, idx) => {
                    const yVal = padding + (idx / 3) * (svgH - padding * 2);
                    const label = (1.5 - (idx / 3) * 1.5).toFixed(1);
                    return (
                      <g key={idx}>
                        <line x1={padding} y1={yVal} x2={svgW - padding} y2={yVal} className="stroke-slate-200 stroke-[0.75]" />
                        <text x={padding - 6} y={yVal + 3} className="fill-slate-400 font-mono text-[9px] text-right" textAnchor="end">{label}</text>
                      </g>
                    );
                  })}
                  {/* X Axis coordinates */}
                  {TRAINING_HISTORY.map((d, index) => {
                    const x = padding + (index / 9) * (svgW - padding * 2);
                    return (
                      <g key={index}>
                        <line x1={x} y1={svgH - padding} x2={x} y2={padding} className="stroke-slate-200 stroke-[0.75] stroke-dasharray-[1,4]" />
                        <text x={x} y={svgH - padding + 12} className="fill-slate-400 font-mono text-[8px] text-center" textAnchor="middle">e{index+1}</text>
                        {/* Selector indicator */}
                        {index + 1 === selectedEpoch && (
                          <circle cx={x} cy={svgH - padding - (d.valLoss / 1.5) * (svgH - padding * 2)} r="4" className="fill-rose-500 stroke-white stroke-2 animate-ping" />
                        )}
                      </g>
                    );
                  })}

                  {/* Draw Paths */}
                  <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" points={lossPts.lossPoints} />
                  <polyline fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,3" points={lossPts.valLossPoints} />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: F1 ledger Report Panel */}
      {activeTab === "report" && (
        <div className="mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4">
            <h4 className="font-sans text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Award className="text-indigo-600 w-4 h-4" />
              EMNIST Class F1 ledger Overview
            </h4>
            <p className="font-sans text-[11px] text-slate-600 leading-normal mb-3">
              The classification report maps localized accuracy characteristics. Letters with high F1-Scores (like <strong>M</strong>, <strong>O</strong>, <strong>W</strong>, <strong>X</strong>, and <strong>Z</strong>) indicate robust, distinct feature shapes with low confusion rates.
            </p>

            {/* Keyword search input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search class letter (A-Z)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-sm pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-sans text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full font-sans text-xs text-left text-slate-600 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] text-slate-500 uppercase">
                  <th onClick={() => handleSort("letter")} className="py-3 px-4 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-all">
                    Class Letter {sortBy === "letter" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th onClick={() => handleSort("precision")} className="py-3 px-4 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-all">
                    Precision {sortBy === "precision" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th onClick={() => handleSort("recall")} className="py-3 px-4 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-all">
                    Recall {sortBy === "recall" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th onClick={() => handleSort("f1Score")} className="py-3 px-4 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-all">
                    F1-Score {sortBy === "f1Score" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                  <th onClick={() => handleSort("support")} className="py-3 px-4 cursor-pointer hover:bg-slate-200 hover:text-slate-800 transition-all">
                    Support samples {sortBy === "support" && (sortOrder === "asc" ? <ChevronUp className="inline w-3 h-3 ml-0.5" /> : <ChevronDown className="inline w-3 h-3 ml-0.5" />)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {sortedReport.map((metric) => {
                  const isTopPerformer = ["M", "O", "W", "X", "Z"].includes(metric.letter);

                  return (
                    <tr
                      key={metric.letter}
                      className={`hover:bg-slate-50/50 transition-all ${
                        isTopPerformer ? "bg-emerald-50/30 font-medium" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                          isTopPerformer ? "bg-emerald-100 text-emerald-800" : "bg-slate-100"
                        }`}>
                          {metric.letter}
                        </span>
                        {isTopPerformer && (
                          <span className="text-[9px] font-mono bg-emerald-100 border border-emerald-200 px-1 rounded text-emerald-800 font-semibold uppercase">
                            Top class accuracy
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{(metric.precision * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-4 font-mono">{(metric.recall * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {(metric.f1Score * 100).toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{metric.support}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Analogy Section */}
      {activeTab === "analogy" && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Literal Explanation */}
          <div className="space-y-4">
            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl">
              <h4 className="font-sans font-semibold text-sm text-amber-900 flex items-center gap-2 mb-2">
                <Users className="w-4.5 h-4.5 text-amber-600" />
                The Analogy: "100 Students studying together"
              </h4>
              <p className="font-sans text-xs text-slate-600 leading-relaxed leading-normal">
                Imagine 100 students studying for an exam. If the same 10 hyper-focused students always answer every practice query, the remaining 90 students may become over-dependent, failing to formulate their own independent neural models.
              </p>
              <p className="font-sans text-xs text-slate-600 leading-relaxed leading-normal mt-3">
                <strong>Dropout works identically on the ANN:</strong> randomly ignoring a set rate (e.g. 30%) of neurons during each training step. This forces all nodes to adapt and build redundant, highly resilient feature pathways instead of memorizing singular pixels!
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <h5 className="font-sans font-bold text-slate-800 text-xs mb-2">Key Benefits of Dropout(0.3)</h5>
              <ul className="space-y-2 font-sans text-xs text-slate-500">
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <strong>Prevents overfitting</strong> by neutralizing neuron-level co-dependencies.
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <strong>Improves generalization</strong> so the model accepts diverse handwritten fonts.
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <strong>Normalizes predictions</strong>, leading to higher accuracy metrics on raw testing data.
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive student simulator */}
          <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-4">
              <span className="font-sans text-xs font-bold text-slate-700">Student Neuron Co-dependency Grid</span>
              <span className="font-mono text-[9px] bg-amber-100 border border-amber-200 text-amber-800 rounded px-1 text-center select-none font-semibold uppercase">
                4/12 nodes Dropped
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {initialStudents.map((elem) => (
                <div
                  key={elem.id}
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                    elem.isDropped
                      ? "bg-red-50 border-red-200 opacity-60 line-through select-none text-red-400"
                      : "bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xs text-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-[9px] font-bold text-slate-400">#N{elem.id}</span>
                    <span className={`w-2 h-2 rounded-full ${elem.isDropped ? "bg-red-400" : "bg-emerald-400"}`} />
                  </div>
                  
                  <div className="mt-4">
                    <span className="block font-sans text-xs font-bold text-slate-800">{elem.name}</span>
                    <span className="block font-sans text-[10px] text-slate-400 leading-normal italic mt-0.5">{elem.role}</span>
                  </div>

                  {elem.isDropped ? (
                    <span className="block text-[9px] font-bold text-red-500 mt-2 bg-red-100/50 text-center rounded py-0.5">DROPPED (Studying)</span>
                  ) : (
                    <span className="block text-[9px] font-bold text-emerald-600 mt-2 bg-emerald-50 text-center rounded py-0.5">LEARNING ACTIVE</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
