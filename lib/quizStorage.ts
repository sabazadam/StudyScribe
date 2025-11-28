/**
 * Quiz Storage Layer
 * Database-ready abstraction that currently uses file system
 * Can be easily swapped with Prisma/Drizzle ORM later
 */

import fs from 'fs';
import path from 'path';
import {
  Quiz,
  QuizAttempt,
  QuizProgress,
  QuizListItem,
  QuizStorageSchema,
  QuizSession,
} from './quizTypes';

const STORAGE_DIR = path.join(process.cwd(), 'public', 'study-materials', 'quizzes');
const QUIZ_FILE = path.join(STORAGE_DIR, 'quizzes.json');
const ATTEMPTS_FILE = path.join(STORAGE_DIR, 'attempts.json');
const SESSIONS_FILE = path.join(STORAGE_DIR, 'sessions.json');

/**
 * Initialize storage directory and files
 */
function ensureStorageExists(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  if (!fs.existsSync(QUIZ_FILE)) {
    fs.writeFileSync(
      QUIZ_FILE,
      JSON.stringify({ quizzes: [], lastUpdated: new Date().toISOString() }, null, 2)
    );
  }

  if (!fs.existsSync(ATTEMPTS_FILE)) {
    fs.writeFileSync(
      ATTEMPTS_FILE,
      JSON.stringify({ attempts: [], lastUpdated: new Date().toISOString() }, null, 2)
    );
  }

  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(
      SESSIONS_FILE,
      JSON.stringify({ sessions: [], lastUpdated: new Date().toISOString() }, null, 2)
    );
  }
}

/**
 * Read all quizzes from storage
 */
export function getAllQuizzes(): Quiz[] {
  try {
    ensureStorageExists();
    const data = fs.readFileSync(QUIZ_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.quizzes || [];
  } catch (error) {
    console.error('Error reading quizzes:', error);
    return [];
  }
}

/**
 * Get quiz by ID
 */
export function getQuizById(id: string): Quiz | null {
  const quizzes = getAllQuizzes();
  return quizzes.find(q => q.id === id) || null;
}

/**
 * Get quizzes by material ID
 */
export function getQuizzesByMaterialId(materialId: string): Quiz[] {
  const quizzes = getAllQuizzes();
  return quizzes.filter(q => q.materialId === materialId);
}

/**
 * Create new quiz
 */
export function createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Quiz {
  ensureStorageExists();

  const newQuiz: Quiz = {
    ...quiz,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const quizzes = getAllQuizzes();
  quizzes.push(newQuiz);

  fs.writeFileSync(
    QUIZ_FILE,
    JSON.stringify({ quizzes, lastUpdated: new Date().toISOString() }, null, 2)
  );

  return newQuiz;
}

/**
 * Update existing quiz
 */
export function updateQuiz(id: string, updates: Partial<Quiz>): Quiz | null {
  ensureStorageExists();

  const quizzes = getAllQuizzes();
  const index = quizzes.findIndex(q => q.id === id);

  if (index === -1) return null;

  quizzes[index] = {
    ...quizzes[index],
    ...updates,
    id, // Prevent ID change
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    QUIZ_FILE,
    JSON.stringify({ quizzes, lastUpdated: new Date().toISOString() }, null, 2)
  );

  return quizzes[index];
}

/**
 * Delete quiz
 */
export function deleteQuiz(id: string): boolean {
  ensureStorageExists();

  const quizzes = getAllQuizzes();
  const filteredQuizzes = quizzes.filter(q => q.id !== id);

  if (filteredQuizzes.length === quizzes.length) return false;

  fs.writeFileSync(
    QUIZ_FILE,
    JSON.stringify({ quizzes: filteredQuizzes, lastUpdated: new Date().toISOString() }, null, 2)
  );

  // Also delete associated attempts
  const attempts = getAllAttempts();
  const filteredAttempts = attempts.filter(a => a.quizId !== id);
  fs.writeFileSync(
    ATTEMPTS_FILE,
    JSON.stringify({ attempts: filteredAttempts, lastUpdated: new Date().toISOString() }, null, 2)
  );

  return true;
}

/**
 * Get all attempts
 */
export function getAllAttempts(): QuizAttempt[] {
  try {
    ensureStorageExists();
    const data = fs.readFileSync(ATTEMPTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.attempts || [];
  } catch (error) {
    console.error('Error reading attempts:', error);
    return [];
  }
}

/**
 * Get attempts for specific quiz
 */
export function getQuizAttempts(quizId: string): QuizAttempt[] {
  const attempts = getAllAttempts();
  return attempts.filter(a => a.quizId === quizId).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Save quiz attempt
 */
export function saveAttempt(attempt: Omit<QuizAttempt, 'id' | 'timestamp'>): QuizAttempt {
  ensureStorageExists();

  const newAttempt: QuizAttempt = {
    ...attempt,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  const attempts = getAllAttempts();
  attempts.push(newAttempt);

  fs.writeFileSync(
    ATTEMPTS_FILE,
    JSON.stringify({ attempts, lastUpdated: new Date().toISOString() }, null, 2)
  );

  return newAttempt;
}

/**
 * Get quiz progress/statistics
 */
export function getQuizProgress(quizId: string): QuizProgress | null {
  const attempts = getQuizAttempts(quizId);

  if (attempts.length === 0) return null;

  const scores = attempts.map(a => a.score);
  const percentages = attempts.map(a => a.percentage);
  const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);

  return {
    quizId,
    attemptCount: attempts.length,
    bestScore: Math.max(...scores),
    bestPercentage: Math.max(...percentages),
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
    lastAttemptDate: attempts[0].timestamp,
    firstAttemptDate: attempts[attempts.length - 1].timestamp,
    totalTimeSpent: totalTime,
  };
}

/**
 * Get quiz list items with stats (for hub view)
 */
export function getQuizListItems(): QuizListItem[] {
  const quizzes = getAllQuizzes();

  return quizzes.map(quiz => {
    const attempts = getQuizAttempts(quiz.id);
    const lastAttempt = attempts[0];
    const progress = getQuizProgress(quiz.id);

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      questionCount: quiz.questions.length,
      materialId: quiz.materialId,
      status: quiz.status,
      timeLimit: quiz.timeLimit,
      createdAt: quiz.createdAt,
      lastAttempt: lastAttempt ? {
        date: lastAttempt.timestamp,
        score: lastAttempt.score,
        percentage: lastAttempt.percentage,
      } : undefined,
      stats: progress ? {
        attemptCount: progress.attemptCount,
        bestPercentage: progress.bestPercentage,
      } : undefined,
    };
  });
}

/**
 * Save quiz session (for continue where left off)
 */
export function saveQuizSession(session: QuizSession): void {
  ensureStorageExists();

  try {
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const sessions: QuizSession[] = parsed.sessions || [];

    // Remove existing session for this quiz
    const filteredSessions = sessions.filter(s => s.quizId !== session.quizId);
    filteredSessions.push(session);

    fs.writeFileSync(
      SESSIONS_FILE,
      JSON.stringify({ sessions: filteredSessions, lastUpdated: new Date().toISOString() }, null, 2)
    );
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

/**
 * Get quiz session
 */
export function getQuizSession(quizId: string): QuizSession | null {
  try {
    ensureStorageExists();
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const sessions: QuizSession[] = parsed.sessions || [];
    return sessions.find(s => s.quizId === quizId) || null;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
}

/**
 * Delete quiz session
 */
export function deleteQuizSession(quizId: string): void {
  try {
    ensureStorageExists();
    const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    const sessions: QuizSession[] = parsed.sessions || [];
    const filteredSessions = sessions.filter(s => s.quizId !== quizId);

    fs.writeFileSync(
      SESSIONS_FILE,
      JSON.stringify({ sessions: filteredSessions, lastUpdated: new Date().toISOString() }, null, 2)
    );
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Search quizzes by title or description
 */
export function searchQuizzes(query: string): Quiz[] {
  const quizzes = getAllQuizzes();
  const lowerQuery = query.toLowerCase();

  return quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(lowerQuery) ||
    (quiz.description?.toLowerCase().includes(lowerQuery))
  );
}
