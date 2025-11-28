/**
 * Quiz System Type Definitions
 * Database-ready structure for easy migration
 */

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuizStatus = 'draft' | 'published' | 'archived';

/**
 * Individual quiz question with multiple choice options
 */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // 4-5 options
  correctAnswer: number; // Index of correct option (0-based)
  explanation: string; // Why this answer is correct/others are wrong
  difficulty?: QuestionDifficulty;
  order: number; // Original order before randomization
}

/**
 * Main quiz object
 */
export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  materialId?: string; // Link to source study material
  status: QuizStatus;
  timeLimit?: number; // Time limit in seconds (optional)
  passingScore?: number; // Minimum percentage to pass (optional)
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

/**
 * User's answer to a single question
 */
export interface QuizAnswer {
  questionId: string;
  selectedOption: number; // Index of selected option
  isCorrect?: boolean; // Calculated server-side
  timeSpent?: number; // Seconds spent on this question
}

/**
 * Complete quiz attempt/submission
 */
export interface QuizAttempt {
  id: string;
  quizId: string;
  answers: QuizAnswer[];
  score: number; // Number of correct answers
  percentage: number; // Score as percentage
  totalQuestions: number;
  timeSpent: number; // Total time in seconds
  timestamp: string;
  passed?: boolean; // Whether user passed (if passingScore is set)
}

/**
 * Quiz progress and statistics
 */
export interface QuizProgress {
  quizId: string;
  attemptCount: number;
  bestScore: number;
  bestPercentage: number;
  averageScore: number;
  averagePercentage: number;
  lastAttemptDate: string;
  firstAttemptDate: string;
  totalTimeSpent: number;
}

/**
 * Request payload for generating quiz from material
 */
export interface GenerateQuizRequest {
  materialId: string;
  title: string;
  questionCount?: number; // Default: 10
  difficulty?: QuestionDifficulty;
  timeLimit?: number;
}

/**
 * Request payload for submitting quiz
 */
export interface SubmitQuizRequest {
  quizId: string;
  answers: QuizAnswer[];
  timeSpent: number;
}

/**
 * Response after submitting quiz
 */
export interface SubmitQuizResponse {
  attempt: QuizAttempt;
  questions: (QuizQuestion & {
    userAnswer: number;
    isCorrect: boolean;
  })[];
}

/**
 * Quiz list item (summary view)
 */
export interface QuizListItem {
  id: string;
  title: string;
  description?: string;
  questionCount: number;
  materialId?: string;
  status: QuizStatus;
  timeLimit?: number;
  createdAt: string;
  lastAttempt?: {
    date: string;
    score: number;
    percentage: number;
  };
  stats?: {
    attemptCount: number;
    bestPercentage: number;
  };
}

/**
 * Quiz session state (for continue where left off)
 */
export interface QuizSession {
  quizId: string;
  startedAt: string;
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  timeRemaining?: number;
  randomizedQuestions: string[]; // Array of question IDs in randomized order
}

/**
 * Database-ready storage structure
 * This structure can be easily migrated to a relational database
 */
export interface QuizStorageSchema {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  lastUpdated: string;
}
