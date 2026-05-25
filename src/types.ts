export interface PredictionResult {
  success: boolean;
  letter: string;
  confidence: number;
  probabilities: number[];
  interpretation: string;
  isDemo: boolean;
  warning?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  letter: string;
  drawnImage: string;
  confidence: number;
}

export interface EpochMetric {
  epoch: number;
  accuracy: number;
  valAccuracy: number;
  loss: number;
  valLoss: number;
}

export interface ClassMetric {
  letter: string;
  precision: number;
  recall: number;
  f1Score: number;
  support: number;
}
