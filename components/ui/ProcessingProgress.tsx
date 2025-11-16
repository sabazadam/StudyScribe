'use client';

export type ProcessingState = 'pending' | 'processing' | 'completed' | 'error' | 'skipped';

export interface ProcessingTask {
  id: string;
  label: string;
  icon: string;
  status: ProcessingState;
  message?: string;
  color: string;
}

interface ProcessingProgressProps {
  tasks: ProcessingTask[];
  currentMessage?: string;
}

export default function ProcessingProgress({ tasks, currentMessage }: ProcessingProgressProps) {
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.filter(t => t.status !== 'skipped').length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getStatusIcon = (status: ProcessingState): string => {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'error': return 'error';
      case 'processing': return 'autorenew';
      case 'skipped': return 'remove_circle';
      default: return 'radio_button_unchecked';
    }
  };

  const getStatusColor = (status: ProcessingState): string => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'processing': return 'text-blue-500';
      case 'skipped': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  const getBackgroundColor = (color: string, status: ProcessingState): string => {
    if (status === 'skipped') return 'bg-gray-100 dark:bg-gray-800';
    if (status === 'error') return 'bg-red-50 dark:bg-red-900/20';
    if (status === 'completed') return 'bg-green-50 dark:bg-green-900/20';
    if (status === 'processing') return `${color} bg-opacity-10`;
    return 'bg-gray-50 dark:bg-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Processing your lecture materials...
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current Status Message */}
      {currentMessage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center space-x-3">
          <span className="material-symbols-outlined text-blue-500 animate-spin">
            autorenew
          </span>
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            {currentMessage}
          </p>
        </div>
      )}

      {/* Individual Task Progress */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`
              rounded-xl p-4 border-2 transition-all duration-300
              ${getBackgroundColor(task.color, task.status)}
              ${task.status === 'processing' ? 'border-blue-300 dark:border-blue-700 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
              ${task.status === 'completed' ? 'border-green-300 dark:border-green-700' : ''}
              ${task.status === 'error' ? 'border-red-300 dark:border-red-700' : ''}
            `}
          >
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <span className={`material-symbols-outlined text-3xl ${task.status === 'processing' ? 'animate-spin' : ''} ${getStatusColor(task.status)}`}>
                  {task.status === 'processing' ? 'autorenew' : task.icon}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {task.label}
                  </h4>
                  {/* Status Badge */}
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : ''}
                    ${task.status === 'processing' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : ''}
                    ${task.status === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : ''}
                    ${task.status === 'skipped' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : ''}
                    ${task.status === 'pending' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : ''}
                  `}>
                    {task.status === 'completed' && '✓ Complete'}
                    {task.status === 'processing' && 'Processing...'}
                    {task.status === 'error' && '✗ Error'}
                    {task.status === 'skipped' && 'Skipped'}
                    {task.status === 'pending' && 'Waiting...'}
                  </span>
                </div>
                {task.message && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {task.message}
                  </p>
                )}
              </div>

              {/* Status Indicator */}
              <div className="flex-shrink-0">
                <span className={`material-symbols-outlined text-2xl ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                </span>
              </div>
            </div>

            {/* Progress bar for processing state */}
            {task.status === 'processing' && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {tasks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {tasks.filter(t => t.status === 'processing').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {tasks.filter(t => t.status === 'skipped').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Skipped</div>
        </div>
      </div>
    </div>
  );
}
