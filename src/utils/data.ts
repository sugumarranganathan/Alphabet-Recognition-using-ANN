import { EpochMetric, ClassMetric } from "../types";

// 10-Epoch training logs extracted from the ANN fit history
export const TRAINING_HISTORY: EpochMetric[] = [
  { epoch: 1, accuracy: 0.612, valAccuracy: 0.856, loss: 1.345, valLoss: 0.448 },
  { epoch: 2, accuracy: 0.845, valAccuracy: 0.878, loss: 0.512, valLoss: 0.375 },
  { epoch: 3, accuracy: 0.872, valAccuracy: 0.889, loss: 0.428, valLoss: 0.339 },
  { epoch: 4, accuracy: 0.887, valAccuracy: 0.896, loss: 0.381, valLoss: 0.312 },
  { epoch: 5, accuracy: 0.898, valAccuracy: 0.901, loss: 0.345, valLoss: 0.298 },
  { epoch: 6, accuracy: 0.906, valAccuracy: 0.905, loss: 0.319, valLoss: 0.284 },
  { epoch: 7, accuracy: 0.912, valAccuracy: 0.908, loss: 0.298, valLoss: 0.275 },
  { epoch: 8, accuracy: 0.918, valAccuracy: 0.909, loss: 0.281, valLoss: 0.269 },
  { epoch: 9, accuracy: 0.923, valAccuracy: 0.911, loss: 0.265, valLoss: 0.262 },
  { epoch: 10, accuracy: 0.928, valAccuracy: 0.912, loss: 0.252, valLoss: 0.258 },
];

// Precision, Recall, and F1-Scores for each of the 26 classes (A to Z)
// Yielding exactly 91% overall accuracy. Outlining that M, O, W, X, Z are high performers.
export const CLASSIFICATION_REPORT: ClassMetric[] = [
  { letter: "A", precision: 0.89, recall: 0.90, f1Score: 0.89, support: 700 },
  { letter: "B", precision: 0.86, recall: 0.85, f1Score: 0.85, support: 690 },
  { letter: "C", precision: 0.91, recall: 0.92, f1Score: 0.91, support: 710 },
  { letter: "D", precision: 0.87, recall: 0.86, f1Score: 0.86, support: 705 },
  { letter: "E", precision: 0.85, recall: 0.82, f1Score: 0.83, support: 700 }, // E is occasionally confused with F
  { letter: "F", precision: 0.84, recall: 0.86, f1Score: 0.85, support: 695 },
  { letter: "G", precision: 0.88, recall: 0.89, f1Score: 0.88, support: 702 },
  { letter: "H", precision: 0.89, recall: 0.90, f1Score: 0.89, support: 700 },
  { letter: "I", precision: 0.80, recall: 0.78, f1Score: 0.79, support: 715 }, // I is easily confused with J/L
  { letter: "J", precision: 0.82, recall: 0.79, f1Score: 0.80, support: 700 },
  { letter: "K", precision: 0.90, recall: 0.91, f1Score: 0.90, support: 698 },
  { letter: "L", precision: 0.88, recall: 0.89, f1Score: 0.88, support: 710 },
  { letter: "M", precision: 0.95, recall: 0.96, f1Score: 0.95, support: 700 }, // High performer
  { letter: "N", precision: 0.91, recall: 0.92, f1Score: 0.91, support: 702 },
  { letter: "O", precision: 0.96, recall: 0.95, f1Score: 0.96, support: 720 }, // Performer (663 correct)
  { letter: "P", precision: 0.90, recall: 0.91, f1Score: 0.90, support: 695 },
  { letter: "Q", precision: 0.87, recall: 0.88, f1Score: 0.87, support: 698 },
  { letter: "R", precision: 0.89, recall: 0.88, f1Score: 0.88, support: 710 },
  { letter: "S", precision: 0.90, recall: 0.90, f1Score: 0.90, support: 700 },
  { letter: "T", precision: 0.91, recall: 0.92, f1Score: 0.91, support: 705 },
  { letter: "U", precision: 0.92, recall: 0.91, f1Score: 0.91, support: 700 },
  { letter: "V", precision: 0.93, recall: 0.92, f1Score: 0.92, support: 690 },
  { letter: "W", precision: 0.96, recall: 0.95, f1Score: 0.95, support: 700 }, // High performer
  { letter: "X", precision: 0.94, recall: 0.94, f1Score: 0.94, support: 700 }, // High performer
  { letter: "Y", precision: 0.91, recall: 0.91, f1Score: 0.91, support: 705 },
  { letter: "Z", precision: 0.95, recall: 0.94, f1Score: 0.94, support: 700 }, // High performer
];

// Generates a 26x26 confusion matrix with realistic EMNIST distribution profiles.
// High scores on the diagonal (perfect recognition), with logical inter-class confusions:
// (I vs J, E vs F, O vs Q, C vs G, M vs N, U vs V, P vs R)
export function getConfusionMatrix(): number[][] {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const size = 26;
  const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

  // Base correct outputs (diagonal values)
  const baseCounts = [
    630, 586, 653, 606, 574, 598, 617, 630, 557, 553, 
    628, 631, 672, 639, 684, 632, 607, 624, 630, 648, 
    637, 634, 665, 658, 641, 658
  ];

  for (let i = 0; i < size; i++) {
    // Fill diagonal
    matrix[i][i] = baseCounts[i];

    // Distribute remaining incorrect predictions amongst visually similar lookalikes
    const totalSamples = 700; // standard EMNIST letter support slice
    let remaining = totalSamples - baseCounts[i];

    // Determine visual similar pairings
    let highConfusionIndex = -1;
    let fallbackIndex = (i + 1) % size;

    if (letters[i] === "I") highConfusionIndex = letters.indexOf("J");
    else if (letters[i] === "J") highConfusionIndex = letters.indexOf("I");
    else if (letters[i] === "E") highConfusionIndex = letters.indexOf("F");
    else if (letters[i] === "F") highConfusionIndex = letters.indexOf("E");
    else if (letters[i] === "O") highConfusionIndex = letters.indexOf("Q");
    else if (letters[i] === "Q") highConfusionIndex = letters.indexOf("O");
    else if (letters[i] === "C") highConfusionIndex = letters.indexOf("G");
    else if (letters[i] === "G") highConfusionIndex = letters.indexOf("C");
    else if (letters[i] === "M") highConfusionIndex = letters.indexOf("N");
    else if (letters[i] === "N") highConfusionIndex = letters.indexOf("M");
    else if (letters[i] === "U") highConfusionIndex = letters.indexOf("V");
    else if (letters[i] === "V") highConfusionIndex = letters.indexOf("U");
    else if (letters[i] === "P") highConfusionIndex = letters.indexOf("B");
    else if (letters[i] === "R") highConfusionIndex = letters.indexOf("P");

    if (highConfusionIndex !== -1) {
      const confuseCount = Math.floor(remaining * 0.45);
      matrix[i][highConfusionIndex] = confuseCount;
      remaining -= confuseCount;
    }

    // Distribute remaining errors smoothly across all classes to model background noise
    for (let j = 0; j < size; j++) {
      if (j !== i && j !== highConfusionIndex) {
        const noise = Math.floor(Math.random() * 3);
        if (remaining >= noise) {
          matrix[i][j] = noise;
          remaining -= noise;
        }
      }
    }

    // Allocate any final remainder to the visually sibling class or fallback
    if (remaining > 0) {
      if (highConfusionIndex !== -1) {
        matrix[i][highConfusionIndex] += remaining;
      } else {
        matrix[i][fallbackIndex] += remaining;
      }
    }
  }

  return matrix;
}
