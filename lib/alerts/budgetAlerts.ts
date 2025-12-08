/**
 * BUDGET ALERT SYSTEM
 * ==============================================================================
 * Send alerts when budget thresholds are reached
 * Currently logs to console (can be extended to email/Slack/etc.)
 * ==============================================================================
 */

import { getGlobalDailyCost, DAILY_BUDGET_USD } from '@/lib/firestore/costRepository';

// ==============================================================================
// TYPES
// ==============================================================================

export interface BudgetAlert {
  level: 'info' | 'warning' | 'critical' | 'emergency';
  percentage: number;
  currentSpend: number;
  budgetLimit: number;
  message: string;
  timestamp: string;
  breakdown?: {
    generateMaterials: number;
    generateImage: number;
    transcribe: number;
    extractSlides: number;
  };
  topUsers?: Array<{
    userId: string;
    cost: number;
  }>;
}

// ==============================================================================
// ALERT THRESHOLDS
// ==============================================================================

const ALERT_THRESHOLDS = {
  info: 50,       // 50% - Informational
  warning: 70,    // 70% - Warning
  critical: 85,   // 85% - Critical
  emergency: 95,  // 95% - Emergency
};

// Track last alert level to avoid duplicate alerts
let lastAlertLevel: keyof typeof ALERT_THRESHOLDS | null = null;
let lastAlertTimestamp: number = 0;

// Minimum time between alerts of same level (5 minutes)
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

// ==============================================================================
// ALERT FUNCTIONS
// ==============================================================================

/**
 * Check current budget and send alerts if thresholds exceeded
 * Should be called after each expensive operation
 *
 * @returns Alert object if threshold reached, null otherwise
 */
export async function checkAndSendBudgetAlert(): Promise<BudgetAlert | null> {
  try {
    const globalCost = await getGlobalDailyCost();
    const current = globalCost.totalCost;
    const limit = DAILY_BUDGET_USD;
    const percentage = (current / limit) * 100;

    // Determine alert level
    let alertLevel: keyof typeof ALERT_THRESHOLDS | null = null;

    if (percentage >= ALERT_THRESHOLDS.emergency) {
      alertLevel = 'emergency';
    } else if (percentage >= ALERT_THRESHOLDS.critical) {
      alertLevel = 'critical';
    } else if (percentage >= ALERT_THRESHOLDS.warning) {
      alertLevel = 'warning';
    } else if (percentage >= ALERT_THRESHOLDS.info) {
      alertLevel = 'info';
    }

    // No alert needed
    if (!alertLevel) {
      return null;
    }

    // Check cooldown to avoid spam
    const now = Date.now();
    if (
      lastAlertLevel === alertLevel &&
      now - lastAlertTimestamp < ALERT_COOLDOWN_MS
    ) {
      console.log(`[BudgetAlerts] Alert cooldown active for ${alertLevel} level`);
      return null;
    }

    // Create alert
    const alert: BudgetAlert = {
      level: alertLevel,
      percentage,
      currentSpend: current,
      budgetLimit: limit,
      message: generateAlertMessage(alertLevel, percentage, current, limit),
      timestamp: new Date().toISOString(),
      breakdown: globalCost.breakdown,
    };

    // Send alert (currently just logs, can be extended)
    await sendAlert(alert);

    // Update last alert tracking
    lastAlertLevel = alertLevel;
    lastAlertTimestamp = now;

    return alert;
  } catch (error) {
    console.error('[BudgetAlerts] Error checking budget:', error);
    return null;
  }
}

/**
 * Send budget alert at specific percentage
 * Used for testing or manual alerts
 *
 * @param percentage - Current budget percentage
 */
export async function sendBudgetAlert(percentage: number): Promise<void> {
  try {
    const globalCost = await getGlobalDailyCost();
    const current = globalCost.totalCost;
    const limit = DAILY_BUDGET_USD;

    // Determine alert level based on percentage
    let level: BudgetAlert['level'] = 'info';
    if (percentage >= ALERT_THRESHOLDS.emergency) level = 'emergency';
    else if (percentage >= ALERT_THRESHOLDS.critical) level = 'critical';
    else if (percentage >= ALERT_THRESHOLDS.warning) level = 'warning';

    const alert: BudgetAlert = {
      level,
      percentage,
      currentSpend: current,
      budgetLimit: limit,
      message: generateAlertMessage(level, percentage, current, limit),
      timestamp: new Date().toISOString(),
      breakdown: globalCost.breakdown,
    };

    await sendAlert(alert);
  } catch (error) {
    console.error('[BudgetAlerts] Error sending alert:', error);
  }
}

/**
 * Force send alert regardless of cooldown
 * Used for critical situations
 */
export async function forceAlert(level: BudgetAlert['level'], message: string): Promise<void> {
  const globalCost = await getGlobalDailyCost();
  const current = globalCost.totalCost;
  const limit = DAILY_BUDGET_USD;
  const percentage = (current / limit) * 100;

  const alert: BudgetAlert = {
    level,
    percentage,
    currentSpend: current,
    budgetLimit: limit,
    message,
    timestamp: new Date().toISOString(),
    breakdown: globalCost.breakdown,
  };

  await sendAlert(alert);
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Generate alert message based on level and budget status
 */
function generateAlertMessage(
  level: BudgetAlert['level'],
  percentage: number,
  current: number,
  limit: number
): string {
  const remaining = limit - current;

  switch (level) {
    case 'emergency':
      return `🚨 EMERGENCY: Daily budget at ${percentage.toFixed(1)}% ($${current.toFixed(2)}/$${limit}). Only $${remaining.toFixed(2)} remaining! Service may be suspended soon.`;

    case 'critical':
      return `⚠️ CRITICAL: Daily budget at ${percentage.toFixed(1)}% ($${current.toFixed(2)}/$${limit}). $${remaining.toFixed(2)} remaining. Immediate action required.`;

    case 'warning':
      return `⚠️ WARNING: Daily budget at ${percentage.toFixed(1)}% ($${current.toFixed(2)}/$${limit}). $${remaining.toFixed(2)} remaining. Monitor closely.`;

    case 'info':
      return `ℹ️ INFO: Daily budget at ${percentage.toFixed(1)}% ($${current.toFixed(2)}/$${limit}). $${remaining.toFixed(2)} remaining.`;

    default:
      return `Budget update: ${percentage.toFixed(1)}% used ($${current.toFixed(2)}/$${limit})`;
  }
}

/**
 * Send alert to configured channels
 * Currently logs to console, can be extended to:
 * - Email (SendGrid, AWS SES)
 * - Slack (Webhook)
 * - SMS (Twilio)
 * - Discord (Webhook)
 * - PagerDuty (for emergencies)
 */
async function sendAlert(alert: BudgetAlert): Promise<void> {
  // Console logging (always enabled)
  const emoji = {
    emergency: '🚨',
    critical: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
  }[alert.level];

  console.log('\n' + '='.repeat(80));
  console.log(`${emoji} [BUDGET ALERT - ${alert.level.toUpperCase()}] ${emoji}`);
  console.log('='.repeat(80));
  console.log(`Time: ${alert.timestamp}`);
  console.log(`Message: ${alert.message}`);
  console.log(`\nBreakdown:`);
  if (alert.breakdown) {
    console.log(`  - Materials: $${alert.breakdown.generateMaterials.toFixed(2)}`);
    console.log(`  - Images: $${alert.breakdown.generateImage.toFixed(2)}`);
    console.log(`  - Transcriptions: $${alert.breakdown.transcribe.toFixed(2)}`);
    console.log(`  - Slide Extraction: $${alert.breakdown.extractSlides.toFixed(2)}`);
  }
  if (alert.topUsers && alert.topUsers.length > 0) {
    console.log(`\nTop Spenders:`);
    alert.topUsers.forEach((user, i) => {
      console.log(`  ${i + 1}. User ${user.userId}: $${user.cost.toFixed(2)}`);
    });
  }
  console.log('='.repeat(80) + '\n');

  // TODO: Add email notifications
  // if (process.env.ALERT_EMAIL) {
  //   await sendEmailAlert(alert);
  // }

  // TODO: Add Slack notifications
  // if (process.env.SLACK_WEBHOOK_URL) {
  //   await sendSlackAlert(alert);
  // }

  // TODO: Add emergency notifications for critical/emergency levels
  // if (alert.level === 'critical' || alert.level === 'emergency') {
  //   await sendEmergencyNotification(alert);
  // }
}

/**
 * Get current alert status without sending
 * Useful for dashboard display
 */
export async function getAlertStatus(): Promise<{
  currentPercentage: number;
  nextThreshold: number;
  alertLevel: BudgetAlert['level'] | 'none';
  message: string;
}> {
  try {
    const globalCost = await getGlobalDailyCost();
    const current = globalCost.totalCost;
    const limit = DAILY_BUDGET_USD;
    const percentage = (current / limit) * 100;

    let alertLevel: BudgetAlert['level'] | 'none' = 'none';
    let nextThreshold = ALERT_THRESHOLDS.info;

    if (percentage >= ALERT_THRESHOLDS.emergency) {
      alertLevel = 'emergency';
      nextThreshold = 100;
    } else if (percentage >= ALERT_THRESHOLDS.critical) {
      alertLevel = 'critical';
      nextThreshold = ALERT_THRESHOLDS.emergency;
    } else if (percentage >= ALERT_THRESHOLDS.warning) {
      alertLevel = 'warning';
      nextThreshold = ALERT_THRESHOLDS.critical;
    } else if (percentage >= ALERT_THRESHOLDS.info) {
      alertLevel = 'info';
      nextThreshold = ALERT_THRESHOLDS.warning;
    }

    return {
      currentPercentage: percentage,
      nextThreshold,
      alertLevel,
      message: alertLevel === 'none'
        ? `Budget healthy at ${percentage.toFixed(1)}%`
        : generateAlertMessage(alertLevel, percentage, current, limit),
    };
  } catch (error) {
    console.error('[BudgetAlerts] Error getting alert status:', error);
    return {
      currentPercentage: 0,
      nextThreshold: ALERT_THRESHOLDS.info,
      alertLevel: 'none',
      message: 'Unable to determine budget status',
    };
  }
}

/**
 * Reset alert tracking (for testing or daily reset)
 */
export function resetAlertTracking(): void {
  lastAlertLevel = null;
  lastAlertTimestamp = 0;
  console.log('[BudgetAlerts] Alert tracking reset');
}

// ==============================================================================
// FUTURE ENHANCEMENTS
// ==============================================================================

/**
 * TODO: Email alert implementation
 */
// async function sendEmailAlert(alert: BudgetAlert): Promise<void> {
//   // Implement with SendGrid, AWS SES, or similar
// }

/**
 * TODO: Slack alert implementation
 */
// async function sendSlackAlert(alert: BudgetAlert): Promise<void> {
//   // Implement with Slack webhook
// }

/**
 * TODO: Emergency notification (SMS, PagerDuty, etc.)
 */
// async function sendEmergencyNotification(alert: BudgetAlert): Promise<void> {
//   // Implement with Twilio, PagerDuty, or similar
// }
