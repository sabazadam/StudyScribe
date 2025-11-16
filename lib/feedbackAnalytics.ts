export interface FeedbackData {
  id: string;
  materialType: string;
  rating: 'up' | 'down';
  comment: string;
  timestamp: string;
  transcriptLength: number;
  hasSlides: boolean;
  hasImages: boolean;
}

/**
 * Save feedback to localStorage for analytics
 */
export function saveFeedback(data: Omit<FeedbackData, 'id' | 'timestamp'>): void {
  const feedback: FeedbackData = {
    ...data,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };

  // Get existing feedback
  const existing = getFeedbackAnalytics();

  // Add new feedback
  existing.push(feedback);

  // Save back to localStorage
  localStorage.setItem('feedbackAnalytics', JSON.stringify(existing));

  console.log('[Analytics] Feedback saved:', {
    materialType: feedback.materialType,
    rating: feedback.rating,
    hasComment: !!feedback.comment,
  });
}

/**
 * Get all feedback analytics from localStorage
 */
export function getFeedbackAnalytics(): FeedbackData[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem('feedbackAnalytics');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading feedback analytics:', error);
    return [];
  }
}

/**
 * Get feedback statistics by material type
 */
export function getFeedbackStats() {
  const feedback = getFeedbackAnalytics();

  const stats = feedback.reduce((acc, item) => {
    if (!acc[item.materialType]) {
      acc[item.materialType] = {
        total: 0,
        positive: 0,
        negative: 0,
        withComments: 0,
      };
    }

    acc[item.materialType].total++;
    if (item.rating === 'up') acc[item.materialType].positive++;
    if (item.rating === 'down') acc[item.materialType].negative++;
    if (item.comment) acc[item.materialType].withComments++;

    return acc;
  }, {} as Record<string, {
    total: number;
    positive: number;
    negative: number;
    withComments: number;
  }>);

  return stats;
}

/**
 * Get overall satisfaction rate
 */
export function getOverallSatisfaction(): number {
  const feedback = getFeedbackAnalytics();
  if (feedback.length === 0) return 0;

  const positive = feedback.filter(f => f.rating === 'up').length;
  return (positive / feedback.length) * 100;
}

/**
 * Get recent negative feedback for improvement insights
 */
export function getRecentNegativeFeedback(limit: number = 10): FeedbackData[] {
  const feedback = getFeedbackAnalytics();
  return feedback
    .filter(f => f.rating === 'down')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Clear all feedback analytics (for testing)
 */
export function clearFeedbackAnalytics(): void {
  localStorage.removeItem('feedbackAnalytics');
  console.log('[Analytics] All feedback data cleared');
}
