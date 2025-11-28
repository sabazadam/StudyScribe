'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Study Hub where quizzes are now accessed
    router.replace('/hub');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Study Hub...</p>
      </div>
    </div>
  );
}
