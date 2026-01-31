import React, { useEffect, useState } from 'react';
import { useTutorial } from '../context/TutorialContext';
import { X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export default function TutorialModal() {
  const {
    showTutorial,
    currentStep,
    tutorialSteps,
    skipTutorial,
    nextStep,
    prevStep,
    completeTutorial,
  } = useTutorial();

  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const step = tutorialSteps[currentStep];

  // Handle element highlighting
  useEffect(() => {
    if (step.elementId && step.action === 'highlight') {
      const element = document.getElementById(step.elementId);
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, step]);

  if (!showTutorial) return null;

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  return (
    <>
      {/* Overlay with spotlight effect */}
      {highlightedElement && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <circle
                  id="spotlight-circle"
                  cx={`${highlightedElement.getBoundingClientRect().left + highlightedElement.getBoundingClientRect().width / 2}`}
                  cy={`${highlightedElement.getBoundingClientRect().top + highlightedElement.getBoundingClientRect().height / 2}`}
                  r={Math.max(highlightedElement.getBoundingClientRect().width, highlightedElement.getBoundingClientRect().height) / 2 + 20}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.7)"
              mask="url(#spotlight-mask)"
            />
          </svg>
          <div
            className="absolute border-2 border-blue-500 rounded-lg pointer-events-auto"
            style={{
              left: `${highlightedElement.getBoundingClientRect().left - 8}px`,
              top: `${highlightedElement.getBoundingClientRect().top - 8}px`,
              width: `${highlightedElement.getBoundingClientRect().width + 16}px`,
              height: `${highlightedElement.getBoundingClientRect().height + 16}px`,
              boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
            }}
          />
        </div>
      )}

      {/* Modal */}
      <div className={`fixed z-50 ${highlightedElement ? 'bottom-8 right-8' : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'} transition-all duration-300`}>
        <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
          {/* Close button */}
          <button
            onClick={skipTutorial}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-4">
            {step.description}
          </p>

          {/* Detailed instructions */}
          {step.detailedInstructions.length > 0 && (
            <ul className="space-y-2 mb-6">
              {step.detailedInstructions.map((instruction, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 mt-0.5">
                    {instruction}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <button
              onClick={skipTutorial}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
            >
              Skip
            </button>

            <button
              onClick={nextStep}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
              {currentStep !== tutorialSteps.length - 1 && <ChevronRight size={18} />}
            </button>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-6">
            {tutorialSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  // Allow clicking on previous steps or current step
                  if (idx <= currentStep) {
                    // Can go back
                    for (let i = 0; i < currentStep - idx; i++) {
                      prevStep();
                    }
                  }
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'bg-blue-600 w-6'
                    : idx < currentStep
                    ? 'bg-blue-300 w-2 cursor-pointer hover:bg-blue-400'
                    : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
