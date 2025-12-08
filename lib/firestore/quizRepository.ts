/**
 * QUIZ REPOSITORY
 * ==============================================================================
 * Firestore repository for quizzes and quiz attempts with user data isolation
 * All operations enforce userId-based security
 * ==============================================================================
 */

import { adminDb } from '@/lib/firebase/adminConfig';
import admin from '@/lib/firebase/adminConfig';
import { Timestamp } from 'firebase-admin/firestore';
import {
  QuizDocument,
  Quiz,
  QuizQuestion,
  QuizMetadata,
  QuizAttemptDocument,
  QuizAttempt,
  MaterialSources,
  quizDocumentToQuiz,
  quizAttemptDocumentToQuizAttempt,
} from '@/lib/types/firestore';

const QUIZZES_COLLECTION = 'quizzes';
const QUIZ_ATTEMPTS_COLLECTION = 'quiz-attempts';

/**
 * Input type for creating a new quiz
 */
export interface CreateQuizInput {
  quiz: {
    title: string;
    description: string;
    timeLimit?: number;
    questions: QuizQuestion[];
  };
  sources: MaterialSources;
  metadata: QuizMetadata;
}

/**
 * Input type for saving a quiz attempt
 */
export interface SaveQuizAttemptInput {
  quizId: string;
  answers: Record<string, number>; // questionId -> selected option index
  score: number;
  totalPoints: number;
  timeSpent: number; // In seconds
}

/**
 * Save a new quiz to Firestore
 *
 * @param userId - Owner of the quiz
 * @param quizData - Quiz data to save
 * @returns Quiz ID
 */
export async function saveQuiz(
  userId: string,
  quizData: CreateQuizInput
): Promise<string> {
  try {
    if (!userId) {
      throw new Error('userId is required to save quiz');
    }

    const quizzesRef = adminDb.collection(QUIZZES_COLLECTION);

    const docData = {
      userId,
      quiz: quizData.quiz,
      sources: quizData.sources,
      metadata: quizData.metadata,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await quizzesRef.add(docData);

    console.log('[quizRepository] Quiz saved:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[quizRepository] Error saving quiz:', error);
    throw new Error(`Failed to save quiz: ${error.message}`);
  }
}

/**
 * Get a quiz by ID with userId verification
 *
 * @param quizId - Quiz document ID
 * @param userId - User requesting the quiz (must match owner)
 * @returns Quiz or null if not found or unauthorized
 */
export async function getQuizById(
  quizId: string,
  userId: string
): Promise<Quiz | null> {
  try {
    if (!quizId || !userId) {
      throw new Error('quizId and userId are required');
    }

    const docRef = adminDb.collection(QUIZZES_COLLECTION).doc(quizId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log('[quizRepository] Quiz not found:', quizId);
      return null;
    }

    const data = docSnap.data()!;

    // Security check: verify userId matches
    if (data.userId !== userId) {
      console.warn('[quizRepository] Unauthorized access attempt:', {
        quizId,
        requestedBy: userId,
        owner: data.userId,
      });
      return null;
    }

    const quizDoc: QuizDocument = {
      id: docSnap.id,
      userId: data.userId,
      quiz: data.quiz,
      sources: data.sources,
      createdAt: data.createdAt as Timestamp,
      metadata: data.metadata,
    };

    return quizDocumentToQuiz(quizDoc);
  } catch (error: any) {
    console.error('[quizRepository] Error getting quiz:', error);
    throw new Error(`Failed to get quiz: ${error.message}`);
  }
}

/**
 * Get all quizzes for a user
 *
 * @param userId - User ID to fetch quizzes for
 * @param limitCount - Maximum number of quizzes to return (default: 50)
 * @returns Array of quizzes
 */
export async function getUserQuizzes(
  userId: string,
  limitCount: number = 50
): Promise<Quiz[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const quizzesRef = adminDb.collection(QUIZZES_COLLECTION);
    const querySnapshot = await quizzesRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();

    const quizzes: Quiz[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data()!;
      const quizDoc: QuizDocument = {
        id: doc.id,
        userId: data.userId,
        quiz: data.quiz,
        sources: data.sources,
        createdAt: data.createdAt as Timestamp,
        metadata: data.metadata,
      };
      quizzes.push(quizDocumentToQuiz(quizDoc));
    });

    console.log('[quizRepository] Fetched quizzes:', quizzes.length);
    return quizzes;
  } catch (error: any) {
    console.error('[quizRepository] Error getting user quizzes:', error);
    throw new Error(`Failed to get user quizzes: ${error.message}`);
  }
}

/**
 * Delete a quiz
 *
 * @param quizId - Quiz document ID
 * @param userId - User requesting the delete (must match owner)
 * @returns void
 */
export async function deleteQuiz(
  quizId: string,
  userId: string
): Promise<void> {
  try {
    if (!quizId || !userId) {
      throw new Error('quizId and userId are required');
    }

    // First verify ownership
    const quiz = await getQuizById(quizId, userId);
    if (!quiz) {
      throw new Error('Quiz not found or unauthorized');
    }

    const docRef = adminDb.collection(QUIZZES_COLLECTION).doc(quizId);
    await docRef.delete();

    console.log('[quizRepository] Quiz deleted:', quizId);

    // Note: We don't cascade delete attempts here
    // Consider adding a cloud function to clean up orphaned attempts
  } catch (error: any) {
    console.error('[quizRepository] Error deleting quiz:', error);
    throw new Error(`Failed to delete quiz: ${error.message}`);
  }
}

/**
 * Save a quiz attempt
 *
 * @param userId - User who took the quiz
 * @param attemptData - Attempt data
 * @returns Attempt ID
 */
export async function saveQuizAttempt(
  userId: string,
  attemptData: SaveQuizAttemptInput
): Promise<string> {
  try {
    if (!userId) {
      throw new Error('userId is required to save quiz attempt');
    }

    const attemptsRef = adminDb.collection(QUIZ_ATTEMPTS_COLLECTION);

    const docData = {
      userId,
      quizId: attemptData.quizId,
      answers: attemptData.answers,
      score: attemptData.score,
      totalPoints: attemptData.totalPoints,
      timeSpent: attemptData.timeSpent,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await attemptsRef.add(docData);

    console.log('[quizRepository] Quiz attempt saved:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[quizRepository] Error saving quiz attempt:', error);
    throw new Error(`Failed to save quiz attempt: ${error.message}`);
  }
}

/**
 * Get all attempts for a specific quiz by the user
 *
 * @param quizId - Quiz ID
 * @param userId - User ID (must match the user who owns the quiz or took it)
 * @param limitCount - Maximum number of attempts to return
 * @returns Array of quiz attempts
 */
export async function getQuizAttempts(
  quizId: string,
  userId: string,
  limitCount: number = 20
): Promise<QuizAttempt[]> {
  try {
    if (!quizId || !userId) {
      throw new Error('quizId and userId are required');
    }

    const attemptsRef = adminDb.collection(QUIZ_ATTEMPTS_COLLECTION);
    const querySnapshot = await attemptsRef
      .where('quizId', '==', quizId)
      .where('userId', '==', userId)
      .orderBy('completedAt', 'desc')
      .limit(limitCount)
      .get();

    const attempts: QuizAttempt[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data()!;
      const attemptDoc: QuizAttemptDocument = {
        id: doc.id,
        userId: data.userId,
        quizId: data.quizId,
        answers: data.answers,
        score: data.score,
        totalPoints: data.totalPoints,
        completedAt: data.completedAt as Timestamp,
        timeSpent: data.timeSpent,
      };
      attempts.push(quizAttemptDocumentToQuizAttempt(attemptDoc));
    });

    console.log('[quizRepository] Fetched quiz attempts:', attempts.length);
    return attempts;
  } catch (error: any) {
    console.error('[quizRepository] Error getting quiz attempts:', error);
    throw new Error(`Failed to get quiz attempts: ${error.message}`);
  }
}

/**
 * Get all attempts by a user (across all quizzes)
 *
 * @param userId - User ID
 * @param limitCount - Maximum number of attempts to return
 * @returns Array of quiz attempts
 */
export async function getUserAttempts(
  userId: string,
  limitCount: number = 50
): Promise<QuizAttempt[]> {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const attemptsRef = adminDb.collection(QUIZ_ATTEMPTS_COLLECTION);
    const querySnapshot = await attemptsRef
      .where('userId', '==', userId)
      .orderBy('completedAt', 'desc')
      .limit(limitCount)
      .get();

    const attempts: QuizAttempt[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data()!;
      const attemptDoc: QuizAttemptDocument = {
        id: doc.id,
        userId: data.userId,
        quizId: data.quizId,
        answers: data.answers,
        score: data.score,
        totalPoints: data.totalPoints,
        completedAt: data.completedAt as Timestamp,
        timeSpent: data.timeSpent,
      };
      attempts.push(quizAttemptDocumentToQuizAttempt(attemptDoc));
    });

    console.log('[quizRepository] Fetched user attempts:', attempts.length);
    return attempts;
  } catch (error: any) {
    console.error('[quizRepository] Error getting user attempts:', error);
    throw new Error(`Failed to get user attempts: ${error.message}`);
  }
}

/**
 * Get quiz statistics for a user
 * Calculates best score, average score, attempt count, etc.
 *
 * @param quizId - Quiz ID
 * @param userId - User ID
 * @returns Quiz statistics or null if no attempts
 */
export async function getQuizStatistics(
  quizId: string,
  userId: string
): Promise<{
  attemptCount: number;
  bestScore: number;
  averageScore: number;
  bestPercentage: number;
  averagePercentage: number;
  totalTimeSpent: number;
  lastAttemptDate: string;
} | null> {
  try {
    const attempts = await getQuizAttempts(quizId, userId, 100);

    if (attempts.length === 0) {
      return null;
    }

    const scores = attempts.map(a => a.score);
    const percentages = attempts.map(a => (a.score / a.totalPoints) * 100);
    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);

    return {
      attemptCount: attempts.length,
      bestScore: Math.max(...scores),
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestPercentage: Math.max(...percentages),
      averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
      totalTimeSpent: totalTime,
      lastAttemptDate: attempts[0].completedAt, // Already sorted desc
    };
  } catch (error: any) {
    console.error('[quizRepository] Error getting quiz statistics:', error);
    return null;
  }
}
