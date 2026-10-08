export interface Level {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  targetImageUrl: string;
  targetKeywords: string[];
  hints: string;
  description: string;
  // Specific visual elements to draw when matched
  proceduralTheme: string;
}

export interface VisualElement {
  type: string;
  color: string;
  intensity?: number; // 0 to 1
  size?: number;
  position?: { x: number; y: number };
  visible: boolean;
  label?: string;
}

export interface EvaluationResult {
  score: number;
  matchedKeywords: string[];
  missedKeywords: string[];
  feedback: string;
  visualElements: VisualElement[];
  isAiEvaluated: boolean;
}

export interface UserStats {
  completedLevels: number[];
  totalScore: number;
  highScores: Record<number, number>;
  timeTrialBestTimes?: Record<number, number>;
  timeTrialSuccesses?: number[];
  completedDailyChallenges?: string[];
  dailyHighScores?: Record<string, number>;
}
