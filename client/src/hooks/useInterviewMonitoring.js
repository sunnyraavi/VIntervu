import axios from 'axios';

// Hook to reset interview state
export const useInterviewReset = () => {
  const resetInterview = async () => {
    try {
      // Call backend to reset interview state
      await axios.post('http://localhost:5000/api/interview/reset-interview');
      
      // Reload the page to restart from beginning
      window.location.reload();
    } catch (error) {
      console.error('Error resetting interview:', error);
      // Fallback: just reload the page
      window.location.reload();
    }
  };

  return { resetInterview };
};

// Utility to create interview session with enhanced monitoring
export const createMonitoredInterviewSession = (originalSessionData) => {
  return {
    ...originalSessionData,
    monitoringEnabled: true,
    startTime: new Date().toISOString(),
    violations: []
  };
};

// Log violations to server for audit trail
export const logViolation = async (violationData) => {
  try {
    await axios.post('http://localhost:5000/api/interview/log-violation', {
      type: violationData.type,
      message: violationData.message,
      severity: violationData.severity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging violation:', error);
  }
};
