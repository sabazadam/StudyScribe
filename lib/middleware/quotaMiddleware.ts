/**
 * QUOTA ENFORCEMENT MIDDLEWARE
 * ==============================================================================
 * Enforce per-user quotas before expensive operations
 * Prevents wasted API calls when user has exceeded their limits
 * ==============================================================================
 */

import { hasRemainingQuota, UsageType } from '@/lib/firestore/usageRepository';
import { hasExceededBudget, hasExceededGlobalBudget } from '@/lib/firestore/costRepository';

// ==============================================================================
// TYPES
// ==============================================================================

export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public quotaType: UsageType,
    public current: number,
    public limit: number,
    public resetAt: string
  ) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class BudgetExceededError extends Error {
  constructor(
    message: string,
    public current: number,
    public limit: number,
    public isGlobal: boolean = false
  ) {
    super(message);
    this.name = 'BudgetExceededError';
  }
}

// ==============================================================================
// QUOTA ENFORCEMENT
// ==============================================================================

/**
 * Enforce user quota before expensive operations
 * Throws QuotaExceededError if user has exceeded their limit
 *
 * @param userId - User ID
 * @param quotaType - Type of quota to check ('materials', 'images', 'quizzes')
 * @throws QuotaExceededError if quota exceeded
 */
export async function enforceQuota(userId: string, quotaType: UsageType): Promise<void> {
  try {
    const quotaCheck = await hasRemainingQuota(userId, quotaType);

    if (!quotaCheck.hasQuota) {
      // Calculate reset time (midnight UTC)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const resetAt = tomorrow.toISOString();

      const quotaTypeLabel = {
        materials: 'study materials',
        images: 'images',
        quizzes: 'quizzes',
      }[quotaType];

      const message = `Daily quota exceeded for ${quotaTypeLabel}. You've used ${quotaCheck.current} of ${quotaCheck.limit} allowed. Quota resets at midnight UTC.`;

      throw new QuotaExceededError(
        message,
        quotaType,
        quotaCheck.current,
        quotaCheck.limit,
        resetAt
      );
    }

    console.log(
      `[QuotaMiddleware] Quota check passed for user ${userId} (${quotaType}): ${quotaCheck.current}/${quotaCheck.limit} (${quotaCheck.remaining} remaining)`
    );
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      throw error;
    }

    console.error('[QuotaMiddleware] Failed to enforce quota:', error);
    throw new Error('Failed to check quota. Please try again.');
  }
}

/**
 * Enforce user budget before expensive operations
 * Throws BudgetExceededError if user has exceeded their personal budget
 *
 * @param userId - User ID
 * @throws BudgetExceededError if budget exceeded
 */
export async function enforceUserBudget(userId: string): Promise<void> {
  try {
    const budgetCheck = await hasExceededBudget(userId);

    if (budgetCheck.exceeded) {
      const message = `Daily budget exceeded. You've spent $${budgetCheck.current.toFixed(2)} of $${budgetCheck.limit.toFixed(2)} allowed. Budget resets at midnight UTC.`;

      throw new BudgetExceededError(
        message,
        budgetCheck.current,
        budgetCheck.limit,
        false
      );
    }

    console.log(
      `[QuotaMiddleware] Budget check passed for user ${userId}: $${budgetCheck.current.toFixed(2)}/$${budgetCheck.limit.toFixed(2)} ($${budgetCheck.remaining.toFixed(2)} remaining)`
    );
  } catch (error) {
    if (error instanceof BudgetExceededError) {
      throw error;
    }

    console.error('[QuotaMiddleware] Failed to enforce user budget:', error);
    throw new Error('Failed to check budget. Please try again.');
  }
}

/**
 * Enforce global budget before expensive operations
 * Throws BudgetExceededError if platform has exceeded daily budget
 *
 * @throws BudgetExceededError if global budget exceeded
 */
export async function enforceGlobalBudget(): Promise<void> {
  try {
    const globalBudgetCheck = await hasExceededGlobalBudget();

    if (globalBudgetCheck.exceeded) {
      const message = `Platform daily budget exceeded ($${globalBudgetCheck.current.toFixed(2)}/$${globalBudgetCheck.limit.toFixed(2)}). Service will resume tomorrow at midnight UTC.`;

      throw new BudgetExceededError(
        message,
        globalBudgetCheck.current,
        globalBudgetCheck.limit,
        true
      );
    }

    console.log(
      `[QuotaMiddleware] Global budget check passed: $${globalBudgetCheck.current.toFixed(2)}/$${globalBudgetCheck.limit.toFixed(2)} (${globalBudgetCheck.percentage.toFixed(1)}%)`
    );
  } catch (error) {
    if (error instanceof BudgetExceededError) {
      throw error;
    }

    console.error('[QuotaMiddleware] Failed to enforce global budget:', error);
    throw new Error('Failed to check global budget. Please try again.');
  }
}

/**
 * Comprehensive quota and budget check
 * Checks both quota and budget limits before expensive operations
 *
 * @param userId - User ID
 * @param quotaType - Type of quota to check
 * @param checkGlobalBudget - Whether to check global budget (default: true)
 */
export async function enforceQuotaAndBudget(
  userId: string,
  quotaType: UsageType,
  checkGlobalBudget: boolean = true
): Promise<void> {
  // Check quota first (fastest check)
  await enforceQuota(userId, quotaType);

  // Check user budget
  await enforceUserBudget(userId);

  // Check global budget (optional)
  if (checkGlobalBudget) {
    await enforceGlobalBudget();
  }

  console.log(`[QuotaMiddleware] All checks passed for user ${userId} (${quotaType})`);
}

/**
 * Get quota status without throwing errors
 * Useful for displaying quota info to users
 *
 * @param userId - User ID
 * @param quotaType - Type of quota to check
 * @returns Quota status information
 */
export async function getQuotaStatus(
  userId: string,
  quotaType: UsageType
): Promise<{
  hasQuota: boolean;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}> {
  try {
    const quotaCheck = await hasRemainingQuota(userId, quotaType);

    return {
      hasQuota: quotaCheck.hasQuota,
      current: quotaCheck.current,
      limit: quotaCheck.limit,
      remaining: quotaCheck.remaining,
      percentage: quotaCheck.limit === Infinity ? 0 : (quotaCheck.current / quotaCheck.limit) * 100,
    };
  } catch (error) {
    console.error('[QuotaMiddleware] Failed to get quota status:', error);
    throw new Error('Failed to retrieve quota status');
  }
}

/**
 * Get budget status without throwing errors
 * Useful for displaying budget info to users
 *
 * @param userId - User ID
 * @returns Budget status information
 */
export async function getBudgetStatus(userId: string): Promise<{
  exceeded: boolean;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}> {
  try {
    const budgetCheck = await hasExceededBudget(userId);

    return {
      exceeded: budgetCheck.exceeded,
      current: budgetCheck.current,
      limit: budgetCheck.limit,
      remaining: budgetCheck.remaining,
      percentage: budgetCheck.limit === Infinity ? 0 : (budgetCheck.current / budgetCheck.limit) * 100,
    };
  } catch (error) {
    console.error('[QuotaMiddleware] Failed to get budget status:', error);
    throw new Error('Failed to retrieve budget status');
  }
}

/**
 * Get global budget status without throwing errors
 *
 * @returns Global budget status information
 */
export async function getGlobalBudgetStatus(): Promise<{
  exceeded: boolean;
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
}> {
  try {
    return await hasExceededGlobalBudget();
  } catch (error) {
    console.error('[QuotaMiddleware] Failed to get global budget status:', error);
    throw new Error('Failed to retrieve global budget status');
  }
}
