/**
 * VERCEL CRON JOB API: Reset Daily Quotas
 * ==============================================================================
 * Triggered daily at midnight UTC to reset user quotas
 * Secured with CRON_SECRET environment variable
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetDailyQuotas } from '@/lib/cron/resetDailyQuotas';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('[Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedAuth) {
      console.error('[Cron] Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting daily quota reset...');

    // Execute quota reset
    const result = await resetDailyQuotas();

    if (result.success) {
      console.log(`[Cron] Reset completed successfully. Users processed: ${result.usersProcessed}, Errors: ${result.errors}`);
      return NextResponse.json({
        ...result,
        message: 'Daily quotas reset successfully',
      });
    } else {
      console.error('[Cron] Reset completed with errors');
      return NextResponse.json(
        {
          ...result,
          message: 'Daily quotas reset completed with errors',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Cron] Critical error during quota reset:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Critical error during quota reset',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Optionally allow POST as well
export async function POST(request: NextRequest) {
  return GET(request);
}
