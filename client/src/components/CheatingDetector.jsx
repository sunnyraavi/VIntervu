import React, { useEffect, useRef, useState } from 'react';

const CheatingDetector = ({ 
  webcamRef, 
  onCheatingDetected, 
  faceDetectionInterval = 2000,
  confidenceThreshold = 0.6
}) => {
  const [faceDetectionModel, setFaceDetectionModel] = useState(null);
  const [faceAPILoaded, setFaceAPILoaded] = useState(false);
  const detectionIntervalRef = useRef(null);
  const externalDeviceDetectedRef = useRef(false);
  const tabSwitchCountRef = useRef(0);
  const warningCountRef = useRef(0);
  const mouseleft = useRef(false);
  const lastWarningTimeRef = useRef({});

  // Load face detection model with improved error handling
  useEffect(() => {
    const loadFaceDetectionModel = async () => {
      try {
        // Check if face-api already exists globally
        if (window.faceapi && window.faceapi.nets && window.faceapi.nets.ssdMobilenetv1.isLoaded?.()) {
          console.log('Face API already loaded');
          setFaceAPILoaded(true);
          setFaceDetectionModel('loaded');
          return;
        }

        // Load face-api.js library if not already loaded
        if (!window.faceapi) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
          script.async = true;
          
          script.onload = async () => {
            try {
              console.log('Face API library loaded, now loading models...');
              setFaceAPILoaded(true);
              // Load models (use SSD MobileNet v1 for robust detection)
              const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
              await Promise.all([
                window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              ]);
              setFaceDetectionModel('loaded');
              console.log('✓ Face detection models loaded successfully');
            } catch (err) {
              console.error('Error loading face models:', err);
              setFaceDetectionModel('error');
            }
          };

          script.onerror = () => {
            console.error('Failed to load face-api.js library');
            setFaceDetectionModel('error');
          };

          document.head.appendChild(script);
        } else {
          // Face API exists but models might not be loaded
          const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
          setFaceAPILoaded(true);
          await Promise.all([
            window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          ]);
          setFaceDetectionModel('loaded');
          console.log('✓ Face detection models loaded successfully');
        }
      } catch (error) {
        console.error('Error initializing face detection model:', error);
        setFaceDetectionModel('error');
      }
    };

    loadFaceDetectionModel();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Helper function to throttle warnings
  const shouldTriggerWarning = (warningType) => {
    const now = Date.now();
    const lastTime = lastWarningTimeRef.current[warningType] || 0;
    const throttleTime = 3000; // Only trigger same warning type every 3 seconds
    
    if (now - lastTime >= throttleTime) {
      lastWarningTimeRef.current[warningType] = now;
      return true;
    }
    return false;
  };

  // Detect face visibility and gadgets
  useEffect(() => {
    if (!faceDetectionModel || !faceAPILoaded || !window.faceapi) return;

    const detectFace = async () => {
      try {
        const video = webcamRef?.current;
        if (!video) return;

        // Check if video source is available
        if (!video.srcObject || video.srcObject.getTracks().length === 0) {
          console.warn('Video source not available');
          return;
        }

        // Check if video is ready for detection
        if (video.readyState !== video.HAVE_ENOUGH_DATA && video.readyState !== 4) {
          console.warn('Video not ready for detection. ReadyState:', video.readyState);
          return;
        }

        // Ensure video is playing
        if (video.paused) {
          try {
            await video.play();
          } catch (e) {
            console.warn('Could not play video');
            return;
          }
        }

        // Use SSD MobileNetV1 options with configurable confidence
        const options = new window.faceapi.SsdMobilenetv1Options({ minConfidence: confidenceThreshold });
        
        // Get detections + landmarks for occlusion/gadget checks
        const results = await window.faceapi.detectAllFaces(video, options).withFaceLandmarks(true);

        // Log detection results for debugging
        console.log(`Face detection: ${results ? results.length : 0} faces detected`);

        // No face detected
        if (!results || results.length === 0) {
          if (shouldTriggerWarning('no_face_detected')) {
            console.warn('No face detected - triggering warning');
            onCheatingDetected({
              type: 'no_face_detected',
              message: '⚠️ Face not visible! Please keep your face in the camera.',
              severity: 'high'
            });
          }
          return;
        }

        // Multiple faces detected - CHEATING ALERT
        if (results.length > 1) {
          if (shouldTriggerWarning('multiple_faces')) {
            console.warn(`Multiple faces detected (${results.length}) - triggering warning`);
            onCheatingDetected({
              type: 'multiple_faces',
              message: `⚠️ Multiple faces detected (${results.length})! Only you should be visible.`,
              severity: 'high'
            });
          }
          return;
        }

        // Single face detected - advanced occlusion/gadget detection
        const detection = results[0];
        const detectionScore = detection.detection?.score ?? 0;
        const landmarks = detection.landmarks;

        console.log(`Face detected with confidence: ${(detectionScore * 100).toFixed(2)}%`);

        // Calculate landmark coverage to detect occlusion/gadgets
        if (landmarks && landmarks.positions) {
          const landmarkCount = landmarks.positions.length;
          console.log(`Landmarks detected: ${landmarkCount}`);
          
          // Check for specific areas that indicate gadget/hand covering face
          // Eyes area landmarks: indices 36-47
          // Nose area landmarks: indices 27-35
          // Mouth area landmarks: indices 48-68
          
          const eyePoints = landmarks.positions.slice(36, 48) || [];
          const nosePoints = landmarks.positions.slice(27, 35) || [];
          const mouthPoints = landmarks.positions.slice(48, 68) || [];

          console.log(`Eye points: ${eyePoints.length}, Nose points: ${nosePoints.length}, Mouth points: ${mouthPoints.length}`);

          // If key facial features are missing or very low confidence, indicate gadget/occlusion
          if (detectionScore < 0.50 || landmarkCount < 50 || eyePoints.length === 0) {
            if (shouldTriggerWarning('gadget_detected')) {
              console.warn('Gadget/occlusion detected - low confidence or missing facial features');
              onCheatingDetected({
                type: 'gadget_detected',
                message: '⚠️ Gadget or hand detected covering face. Please keep your face fully visible.',
                severity: 'high'
              });
            }
            return;
          }

          // Check for partial face occlusion
          if (detectionScore < confidenceThreshold || landmarkCount < 60 || eyePoints.length < 10) {
            if (shouldTriggerWarning('face_partially_occluded')) {
              console.warn('Face partially occluded detected');
              onCheatingDetected({
                type: 'face_partially_occluded',
                message: '⚠️ Face may be partially covered. Please ensure your full face is visible.',
                severity: 'medium'
              });
            }
          }
        } else {
          console.warn('No landmarks detected for face');
        }
      } catch (error) {
        console.error('Face detection error:', error);
      }
    };

    // Only start detection when model is ready
    if (faceDetectionModel === 'loaded') {
      detectionIntervalRef.current = setInterval(detectFace, faceDetectionInterval);
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [faceDetectionModel, faceAPILoaded, webcamRef, onCheatingDetected, confidenceThreshold, faceDetectionInterval]);

  // Detect tab/window switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current++;
        if (shouldTriggerWarning('tab_switch')) {
          onCheatingDetected({
            type: 'tab_switch',
            message: `⚠️ Tab switch detected! (${tabSwitchCountRef.current}x)`,
            severity: 'high',
            count: tabSwitchCountRef.current
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onCheatingDetected]);

  // Detect external input devices (suspicious input patterns)
  useEffect(() => {
    let eventLog = [];
    const eventThreshold = 15; // events in 100ms
    const maxLogSize = 50;

    const handleMouseMove = (e) => {
      const timestamp = Date.now();
      eventLog.push(timestamp);

      // Keep only recent events (last 100ms)
      eventLog = eventLog.filter(t => timestamp - t < 100);

      // Detect unusually rapid input (bot-like behavior)
      if (eventLog.length > eventThreshold) {
        if (!externalDeviceDetectedRef.current && shouldTriggerWarning('external_device')) {
          externalDeviceDetectedRef.current = true;
          onCheatingDetected({
            type: 'external_device',
            message: '⚠️ Unusual input pattern detected. Please use normal mouse/keyboard input.',
            severity: 'medium'
          });

          // Reset flag after 3 seconds
          setTimeout(() => {
            externalDeviceDetectedRef.current = false;
          }, 3000);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [onCheatingDetected]);

  // Detect right-click and dev tools attempts
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      if (shouldTriggerWarning('suspicious_action')) {
        onCheatingDetected({
          type: 'suspicious_action',
          message: '⚠️ Right-click is disabled during interview.',
          severity: 'low'
        });
      }
    };

    const handleKeyDown = (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+K
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.shiftKey && e.key === 'K')
      ) {
        e.preventDefault();
        if (shouldTriggerWarning('dev_tools_attempt')) {
          onCheatingDetected({
            type: 'dev_tools_attempt',
            message: '⚠️ Dev tools access is not allowed during interview.',
            severity: 'medium'
          });
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCheatingDetected]);

  // Detect window blur (user clicking outside browser)
  useEffect(() => {
    const handleBlur = () => {
      mouseleft.current = true;
      if (shouldTriggerWarning('window_blur')) {
        onCheatingDetected({
          type: 'window_blur',
          message: '⚠️ You left the interview window. Please return immediately!',
          severity: 'high'
        });
      }
    };

    const handleFocus = () => {
      mouseleft.current = false;
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [onCheatingDetected]);

  // This component only sets up detection side-effects and does not render UI.
  // Return `null` so it can be used as a child component without rendering an object.
  return null;
};

export default CheatingDetector;