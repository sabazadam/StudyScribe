'use client';

import React from 'react';

interface Step {
  number: number;
  label: string;
  icon: string;
  description?: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
  onStepClick?: (stepNumber: number) => void;
  allowNavigation?: boolean;
}

export default function StepIndicator({
  currentStep,
  steps,
  onStepClick,
  allowNavigation = false
}: StepIndicatorProps) {
  const handleStepClick = (stepNumber: number) => {
    if (allowNavigation && onStepClick && stepNumber < currentStep) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className="w-full mb-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Mobile: Compact view */}
        <div className="md:hidden">
          <div className="flex items-center justify-between bg-card-light dark:bg-card-dark rounded-xl p-4 shadow-md border border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-heading font-bold">
                {currentStep}
              </div>
              <div>
                <p className="text-xs text-text-muted dark:text-text-dark-muted">
                  Step {currentStep} of {steps.length}
                </p>
                <p className="font-semibold text-oxford-blue dark:text-text-dark">
                  {steps[currentStep - 1]?.label}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-text-muted dark:text-text-dark-muted">
              {steps[currentStep - 1]?.icon}
            </span>
          </div>
        </div>

        {/* Desktop: Full horizontal stepper */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-border-light dark:bg-border-dark"
                 style={{ margin: '0 2.5rem' }}>
              <div
                className="h-full bg-gradient-to-r from-primary to-cerulean transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isUpcoming = stepNumber > currentStep;
                const isClickable = allowNavigation && isCompleted;

                return (
                  <div
                    key={step.number}
                    className="flex flex-col items-center flex-1"
                    style={{ maxWidth: '200px' }}
                  >
                    {/* Step circle */}
                    <button
                      onClick={() => handleStepClick(stepNumber)}
                      disabled={!isClickable}
                      className={`
                        w-11 h-11 rounded-full flex items-center justify-center font-heading font-bold text-sm
                        transition-all duration-300 relative z-10 mb-3
                        ${isCurrent ? 'w-12 h-12 animate-pulse-glow bg-primary text-white shadow-lg' : ''}
                        ${isCompleted ? 'bg-success text-white shadow-md hover:scale-110 cursor-pointer' : ''}
                        ${isUpcoming ? 'bg-card-light dark:bg-card-dark border-2 border-border-light dark:border-border-dark text-text-muted dark:text-text-dark-muted' : ''}
                        ${isClickable ? 'hover:shadow-lg' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-lg">check</span>
                      ) : (
                        <span className="material-symbols-outlined text-lg">
                          {step.icon}
                        </span>
                      )}
                    </button>

                    {/* Step label */}
                    <div className="text-center">
                      <p className={`
                        font-semibold text-sm mb-1 transition-colors
                        ${isCurrent ? 'text-primary dark:text-cerulean' : ''}
                        ${isCompleted ? 'text-success-dark dark:text-success' : ''}
                        ${isUpcoming ? 'text-text-muted dark:text-text-dark-muted' : ''}
                      `}>
                        {step.label}
                      </p>
                      {step.description && (
                        <p className="text-xs text-text-muted dark:text-text-dark-muted max-w-[150px]">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
