import React, { useEffect, useState } from 'react';

const CheatingWarning = ({ 
  violation, 
  onDismiss, 
  onResetInterview,
  warningCount = 0 
}) => {
  const [isVisible, setIsVisible] = useState(!!violation);
  const [autoClose, setAutoClose] = useState(false);

  useEffect(() => {
    if (violation) {
      setIsVisible(true);
      setAutoClose(true);
      
      // Auto dismiss after 4 seconds for non-critical violations
      if (violation.severity !== 'high') {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss();
        }, 4000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [violation, onDismiss]);

  if (!isVisible || !violation) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-orange-500';
      case 'low':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityBgClass = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-orange-50 border-orange-200';
      case 'low':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className={`${getSeverityBgClass(violation.severity)} border-l-4 ${getSeverityColor(violation.severity)} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {violation.severity === 'high' ? '🚨 Serious Warning' : '⚠️ Warning'}
          </h3>
          <span className="text-sm font-semibold text-gray-600">
            Warning #{warningCount}
          </span>
        </div>

        {/* Message */}
        <p className="text-gray-700 mb-4 text-sm">
          {violation.message}
        </p>

        {/* Violation Details */}
        <div className="bg-white bg-opacity-50 p-3 rounded mb-4 text-sm text-gray-600">
          <p><strong>Violation Type:</strong> {violation.type.replace(/_/g, ' ')}</p>
          {violation.count && <p><strong>Occurrences:</strong> {violation.count}x</p>}
        </div>

        {/* Warning - if high severity */}
        {violation.severity === 'high' && (
          <div className="bg-red-100 border border-red-300 p-3 rounded mb-4 text-xs text-red-700">
            <p className="font-semibold mb-1">⚠️ Important Notice:</p>
            <p>Multiple violations may result in interview termination and submission as invalid.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded font-semibold hover:bg-gray-700 transition text-sm"
          >
            Acknowledge
          </button>
          
          {violation.severity === 'high' && (
            <button
              onClick={() => {
                setIsVisible(false);
                onResetInterview();
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition text-sm"
            >
              Restart Interview
            </button>
          )}
        </div>

        {/* Footer Info */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          {autoClose && violation.severity !== 'high' 
            ? 'This message will close automatically...' 
            : 'Please address the issue immediately.'}
        </p>
      </div>
    </div>
  );
};

export default CheatingWarning;
