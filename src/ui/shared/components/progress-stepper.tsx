export interface StepItem {
  key: string;
  label: string;
}

export interface ProgressStepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  className?: string;
}

export function ProgressStepper({
  steps,
  currentStepIndex,
  className = '',
}: ProgressStepperProps) {
  return (
    <div className={`rf-stepper ${className}`.trim()}>
      {steps.map((step, idx) => {
        const isComplete = idx < currentStepIndex;
        const isActive = idx === currentStepIndex;
        const statusClass = isComplete
          ? 'rf-stepper-step--complete'
          : isActive
          ? 'rf-stepper-step--active'
          : '';

        return (
          <div key={step.key} className={`rf-stepper-step ${statusClass}`.trim()}>
            <div className="rf-stepper-marker">
              {isComplete ? '✓' : idx + 1}
            </div>
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
