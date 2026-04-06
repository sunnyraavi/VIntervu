import React, { useRef, useState, useCallback } from 'react';
import Interview from './Interview';
import CheatingDetector from './CheatingDetector';
import CheatingWarning from './CheatingWarning';
import { useInterviewReset, logViolation } from '../hooks/useInterviewMonitoring';

const MonitoredInterview = () => {
  const webcamRef = useRef(null);
  const [currentViolation, setCurrentViolation] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [dismissedViolations, setDismissedViolations] = useState(new Set());
  const { resetInterview } = useInterviewReset();
  const violationTimeoutRef = useRef(null);

  // Handle cheating detection
  const handleCheatingDetected = useCallback((violationData) => {
    // Prevent duplicate violations within 2 seconds
    const violationKey = `${violationData.type}`;
    
    if (dismissedViolations.has(violationKey)) {
      return;
    }

    setWarningCount(prev => prev + 1);
    setCurrentViolation({
      ...violationData,
      id: Date.now(),
      warningNumber: warningCount + 1
    });

    // Log violation to backend for audit trail
    logViolation(violationData);

    // Mark as dismissed to prevent rapid re-triggering
    setDismissedViolations(prev => new Set(prev).add(violationKey));
    
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }

    // Auto reset dismissal after 2 seconds to allow same violation type again
    violationTimeoutRef.current = setTimeout(() => {
      setDismissedViolations(prev => {
        const newSet = new Set(prev);
        newSet.delete(violationKey);
        return newSet;
      });
    }, 2000);
  }, [dismissedViolations, warningCount]);

  const handleDismissWarning = useCallback(() => {
    setCurrentViolation(null);
  }, []);

  const handleResetInterview = useCallback(() => {
    if (window.confirm('Are you sure you want to restart the interview? All progress will be lost.')) {
      resetInterview();
    }
  }, [resetInterview]);

  return (
    <div className="relative w-full">
      {/* Main Interview Component - Pass webcamRef for cheating detection */}
      <Interview forwardedWebcamRef={webcamRef} />
      
      {/* Cheating Detection Monitor - Completely isolated from Interview logic */}
      <CheatingDetector
        webcamRef={webcamRef}
        onCheatingDetected={handleCheatingDetected}
        faceDetectionInterval={2500}
        confidenceThreshold={0.55}
      />

      {/* Warning Modal - Shows violations without blocking interview */}
      <CheatingWarning
        violation={currentViolation}
        onDismiss={handleDismissWarning}
        onResetInterview={handleResetInterview}
        warningCount={warningCount}
      />
    </div>
  );
};

export default MonitoredInterview;
