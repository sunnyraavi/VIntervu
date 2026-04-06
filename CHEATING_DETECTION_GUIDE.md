# Cheating Detection Feature - Implementation Guide

## Overview
A modular cheating detection system has been added to your interview application without disrupting the existing interview flow, question generation, or scoring logic.

## Features Implemented

### 1. **Face Detection Monitoring**
- Detects if the user's face is visible in the webcam
- Warns if user's face is not detected
- Warns if multiple faces are detected (indicating others are present)
- Real-time monitoring at 3-second intervals

### 2. **Tab Switching Detection**
- Detects when user switches away from the interview tab/window
- Logs each instance of tab switching
- Shows warning with switch count

### 3. **External Device Detection**
- Monitors for unusual input patterns
- Detects rapid mouse movements (potential automation)
- Warns about suspicious input devices

### 4. **Developer Tools & Inspection Prevention**
- Blocks right-click context menu
- Prevents opening developer tools (F12, Ctrl+Shift+I, etc.)
- Shows warnings for suspicious actions

### 5. **Window Focus Detection**
- Alerts when user switches to another application
- Logs window blur events

## Architecture - Non-Intrusive Design

The implementation is completely modular and doesn't touch your existing code:

### New Components Created:
1. **CheatingDetector.jsx** - Monitors all cheating indicators
2. **CheatingWarning.jsx** - Beautiful modal for showing warnings
3. **MonitoredInterview.jsx** - Wrapper that combines Interview + Detection
4. **useInterviewMonitoring.js** - Hooks for reset and logging

### Minimal Changes to Existing Code:
- **Interview.jsx**: Only 1 line changed (accepts optional forwardedWebcamRef)
- **App.jsx**: Only 2 lines changed (imports MonitoredInterview)
- **Server Routes**: 2 new endpoints added (no existing logic modified)

## How It Works

### User Flow:
1. User starts interview → MonitoredInterview wraps Interview component
2. CheatingDetector monitors in background (doesn't interfere with interview)
3. If cheating detected → CheatingWarning modal appears
4. User can:
   - **Acknowledge** warning (interview continues)
   - **Restart Interview** (on high-severity violations)
5. Interview logic, questions, scoring all work as before

## Warning Severity Levels

- **High Severity** 🔴
  - No face detected
  - Multiple faces detected
  - Tab switching
  - Window focused on another app
  - Action: Shows option to restart interview

- **Medium Severity** 🟠
  - External device detected
  - Dev tools attempt
  - Action: Auto-dismisses after 4 seconds

- **Low Severity** 🟡
  - Right-click attempt
  - Action: Auto-dismisses after 4 seconds

## New Backend Endpoints

### 1. POST `/api/interview/reset-interview`
- Triggered when user clicks "Restart Interview" on high-severity violation
- Currently just confirms reset; page reload handles actual reset
- **Response**: `{ success: true, message: "Interview will be reset..." }`

### 2. POST `/api/interview/log-violation`
- Logs violations to console (ready for database integration)
- **Payload**: 
  ```json
  {
    "type": "no_face_detected",
    "message": "Face not visible",
    "severity": "high",
    "timestamp": "2024-02-12T..."
  }
  ```
- **Response**: `{ success: true, message: "Violation logged..." }`

## Face Detection Library

Uses **face-api.js** (loaded from CDN):
- No installation needed (loaded from jsDelivr CDN)
- Lightweight and performs well
- Detects faces, landmarks, and expressions
- Models loaded once on component mount

## Configuration Options

In **MonitoredInterview.jsx**, you can adjust:

```jsx
<CheatingDetector
  webcamRef={webcamRef}
  onCheatingDetected={handleCheatingDetected}
  faceDetectionInterval={3000}  // Check every 3 seconds
/>
```

## Integration Points

### Already Integrated:
✅ Interview component works unchanged
✅ Question generation works unchanged  
✅ Scoring logic works unchanged
✅ Webcam feed works unchanged
✅ Speech recognition works unchanged

### Optional Enhancements:
- Modify warning colors in CheatingWarning.jsx
- Adjust detection sensitivity in CheatingDetector.jsx
- Add database logging for violations
- Add severity thresholds to auto-terminate interview

## Testing the Feature

### To Test Face Detection:
1. Start interview
2. Move face out of camera view → See warning
3. Put another person in frame → See warning

### To Test Tab Switching:
1. Start interview and click another tab → See warning

### To Test Dev Tools Blocking:
1. Press F12 or right-click → See warning

### To Test Device Detection:
1. Automated mouse movements are detected

## Future Enhancements

1. **Database Audit Trail**
   - Store violations in Violation model
   - Create reports of suspicious interviews

2. **Severity Thresholds**
   - Auto-terminate after N violations
   - Require manual review for flagged interviews

3. **Advanced Face Analysis**
   - Eye gaze direction (checking notes)
   - Head pose detection (looking away)
   - Expression analysis

4. **Network Monitoring**
   - Detect unusual network patterns
   - Monitor for suspicious file transfers

5. **Admin Dashboard**
   - Review flagged interviews
   - See violation reports
   - Manage suspension rules

## Important Notes

1. **User Privacy**: Face detection happens only in browser; no images are stored
2. **Non-Blocking**: Violations don't interrupt interview flow (except high severity)
3. **Graceful Degradation**: If face-api fails to load, interview continues normally
4. **Browser Compatibility**: Works in modern browsers (Chrome, Edge, Firefox, Safari)

## File Structure

```
src/
├── components/
│   ├── Interview.jsx (✏️ minimal change)
│   ├── CheatingDetector.jsx (🆕 new)
│   ├── CheatingWarning.jsx (🆕 new)
│   └── MonitoredInterview.jsx (🆕 new)
├── hooks/
│   └── useInterviewMonitoring.js (🆕 new)
└── App.jsx (✏️ minimal change)

server/
└── routes/
    └── interview.js (✏️ 2 endpoints added)
```

## Troubleshooting

### Face detection not working?
- Check browser console for errors
- Ensure webcam permission is granted
- Verify face-api CDN is accessible

### Warnings triggering too frequently?
- Adjust `faceDetectionInterval` in MonitoredInterview.jsx
- Tweak detection sensitivity in CheatingDetector.jsx

### Want to disable feature temporarily?
- In App.jsx, change back to `<Interview />` instead of `<MonitoredInterview />`

---

**Created**: February 12, 2026
**Status**: Ready for Testing & Production
