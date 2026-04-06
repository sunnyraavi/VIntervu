# Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONITORED INTERVIEW                          │
│                    (MonitoredInterview.jsx)                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  INTERVIEW COMPONENT                      │  │
│  │              (Interview.jsx - Core Logic)                 │  │
│  │                                                           │  │
│  │  • Question Generation  ────────────┐                    │  │
│  │  • Answer Evaluation    ────────────┼─→ UNCHANGED ✅     │  │
│  │  • Scoring Logic        ────────────┤                    │  │
│  │  • Webcam Feed        ──────────┐   └─────────────────┐  │  │
│  │  • Speech Recognition ─────────┐│                     │  │  │
│  │                               ││                      │  │  │
│  └─────────────────────────────────┼┼──────────────────┬─┘  │
│                                    ││                  │     │
│  ┌─────────────────────────────────┘│                  │     │
│  │                                  │                  │     │
│  │  ┌───────────────────────────────┘   ┌──────────────┘     │
│  │  │                                    │                   │
│  │  ▼                                    ▼                   │
│  │ ┌──────────────────────────────────────────────────┐     │
│  │ │     CHEATING DETECTOR (Background)              │     │
│  │ │   (CheatingDetector.jsx - Isolated)             │     │
│  │ │                                                  │     │
│  │ │  1. Face Detection      [ face-api.js ]         │     │
│  │ │     └─ No face detected │                       │     │
│  │ │     └─ Multiple faces   │                       │     │
│  │ │                         │                       │     │
│  │ │  2. Tab Switching       [ Page Visibility API ] │     │
│  │ │     └─ Document.hidden  │                       │     │
│  │ │                         │                       │     │
│  │ │  3. Device Detection    [ Input Monitoring ]    │     │
│  │ │     └─ Rapid mouse move │                       │     │
│  │ │     └─ Unusual patterns │                       │     │
│  │ │                         │                       │     │
│  │ │  4. Dev Tools Blocking  [ KeyDown Events ]      │     │
│  │ │     └─ F12, Ctrl+Shift+I│                       │     │
│  │ │     └─ Right-click block│                       │     │
│  │ │                         │                       │     │
│  │ │  5. Window Blur         [ window.blur ]         │     │
│  │ │     └─ Focus lost       │                       │     │
│  │ │                         ▼                       │     │
│  │ │              Emit Violation                     │     │
│  │ │          (onCheatingDetected)                   │     │
│  │ └────────────────────┬────────────────────────────┘     │
│  │                      │ Violation Data                    │
│  │                      ▼                                   │
│  │ ┌──────────────────────────────────────────────────┐   │
│  │ │    CHEATING WARNING MODAL (Overlay)              │   │
│  │ │      (CheatingWarning.jsx - UI Layer)            │   │
│  │ │                                                  │   │
│  │ │    ┌──────────────────────────────────┐         │   │
│  │ │    │ 🚨 Serious Warning               │         │   │
│  │ │    │ ⚠️ Face not visible!            │         │   │
│  │ │    │ Please keep face in camera.     │         │   │
│  │ │    │                                  │         │   │
│  │ │    │ [Acknowledge] [Restart Interview]│        │   │
│  │ │    └──────────────────────────────────┘         │   │
│  │ │                                                  │   │
│  │ │  Severity Levels:                               │   │
│  │ │  • HIGH 🔴    → Shows restart option            │   │
│  │ │  • MEDIUM 🟠  → Auto-dismiss after 4s           │   │
│  │ │  • LOW 🟡     → Auto-dismiss after 4s           │   │
│  │ └────────────┬─────────────────────────────────┬──┘   │
│  │             │                                 │         │
│  │             ▼                                 ▼         │
│  │      Interview Continues          Reset Interview      │
│  │      (User Acknowledges)           (User Requests)    │
│  │                                                        │
│  └────────────────────────────────────────────────────────┘
│
│  ALL VIOLATIONS LOGGED TO SERVER (useInterviewMonitoring.js)
│  • Timestamp recorded
│  • Severity tracked
│  • Type documented
│
└─────────────────────────────────────────────────────────────────┘

                             ▼

                    SERVER ENDPOINTS
            (server/routes/interview.js)

    ┌────────────────────────────────────────┐
    │   POST /api/interview/log-violation    │
    │                                        │
    │   Body:                               │
    │   {                                   │
    │     type: string,                    │
    │     message: string,                 │
    │     severity: 'high'|'medium'|'low'  │
    │     timestamp: ISO string            │
    │   }                                   │
    └────────────────────────────────────────┘

    ┌────────────────────────────────────────┐
    │  POST /api/interview/reset-interview   │
    │                                        │
    │  Triggers page reload to restart      │
    │  interview from beginning             │
    │                                        │
    │  Response:                            │
    │  { success: true }                    │
    └────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.jsx
│
└── Router
    │
    └── AppWrapper
        │
        └── Routes
            │
            └── /interview → MonitoredInterview.jsx ⭐ NEW WRAPPER
                │
                ├── Interview.jsx (Original Component)
                │   ├── Avatar Video
                │   ├── Webcam Feed ◄── Ref passed to Detector
                │   ├── Question/Answer Panel
                │   ├── Recording Controls
                │   └── Question Generation Service
                │
                ├── CheatingDetector.jsx ⭐ NEW (Hidden)
                │   ├── Face Detection (face-api.js)
                │   ├── Tab Switch Monitor
                │   ├── Device Detection
                │   ├── Dev Tools Blocker
                │   └── Window Blur Monitor
                │
                └── CheatingWarning.jsx ⭐ NEW (Modal)
                    ├── High Severity Modal
                    ├── Medium Severity Modal
                    ├── Low Severity Modal
                    └── Action Handlers
                        ├── Dismiss
                        └── Reset Interview
```

---

## Data Flow During Interview

```
Start Interview
      │
      ▼
┌─────────────────────────────────────┐
│ MonitoredInterview Component Mount  │
│                                     │
│ 1. Create webcamRef                │
│ 2. Render Interview (pass ref)     │
│ 3. Start CheatingDetector          │
└─────────────────────────────────────┘
      │
      ├──────────────┬──────────────────┬─────────────────┐
      ▼              ▼                  ▼                 ▼
   Interview    FaceDetection      TabSwitch      WindowBlur
   Continues    Monitor             Monitor        Monitor
      │              │                  │               │
      │              │ (every 3s)       │ (on change)   │ (on blur)
      │              ▼                  ▼               ▼
      │          Face Visible?     Document.hidden  Window Focused?
      │          Multiple Faces?   Changed to true  Lost Focus?
      │              │                  │               │
      │              ▼                  ▼               ▼
      │          ✅ OK or          ✅ OK or         ✅ OK or
      │          ❌ Violation      ❌ Violation     ❌ Violation
      │              │                  │               │
      └──────────────┴──────────────────┴───────────────┘
                     │
                     ▼ (Any violation detected)
             handleCheatingDetected()
                     │
                     ├─ Increment warning count
                     ├─ Set current violation state
                     ├─ Call logViolation endpoint
                     └─ Update dismissed violations set
                     │
                     ▼
          CheatingWarning.jsx Renders
                     │
            ┌────────┴────────┐
            ▼                 ▼
        User clicks       Auto-dismiss
        Acknowledge       (4 seconds)
            │                 │
            └────────┬────────┘
                     │
                     ▼
        Clear current violation
        Resume interview flow
        (No interruption to Q&A)
```

---

## Violation Detection Flowchart

```
                        CheatingDetector Running
                              │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
   Face Detection          Tab Monitor          Device Monitor
        │                       │                       │
        ├─ Load face-api    ├─ addEventListener      ├─ Track events
        ├─ Detect faces     │   visibilitychange     ├─ Pattern analysis
        │                   │                        │
        ├─ 0 faces     ✅   └─ document.hidden  ✅   └─ Unusual input  ✅
        │  VIOLATION        │   true                  │ VIOLATION
        │                   │   VIOLATION             │
        ├─ 2+ faces   ✅    ├─ Every switch    LOG   ├─ Log to server
        │  VIOLATION        │   increment       ENDPOINT
        │                   │   warning
        │                   │   count
        │
        └─────────────────────────────────────────────┘
                              │
                              ▼
                    onCheatingDetected()
                              │
                    ┌─────────┴────────┐
                    │                  │
                    ▼                  ▼
             Check if duplicate   Increment counter
             within 2 seconds
                    │                  │
                    ├─ Yes: Skip      └──────┐
                    │                        │
                    └─ No: Continue         │
                              │             ▼
                              │      POST /log-violation
                              │      (Server receives)
                              │             │
                              ▼             ▼
                         Set violation  Console log
                         state          FOR NOW
                              │         (ready for DB)
                              ▼
                         Render Modal
                         with warning
                              │
                              ├─────────────┬──────────────┐
                              ▼             ▼              ▼
                          High Severity  Medium/Low   User Option
                          Auto-show      Auto-dismiss
                          Show 2 btns    after 4s
                          • Acknowledge  • Continue
                          • Restart      interview
                              │
                              ▼
                          User Choice
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
              Acknowledge          Restart
                    │                    │
                    │              POST /reset
                    │              page.reload()
                    │              Interview
                    │              from START
                    │
                    ▼
              Continue Interview
              (no state change)
```

---

## Integration Point Summary

```
┌──────────────────────────────────────────────────────────┐
│            CORE INTERVIEW LOGIC (UNTOUCHED)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  getNextQuestion()            ✅ Works as before       │
│  recordResponse()             ✅ Works as before       │
│  endInterview()               ✅ Works as before       │
│  Score calculation            ✅ Works as before       │
│  Webcam feed                  ✅ Works as before       │
│  Speech recognition           ✅ Works as before       │
│                                                          │
└──────────────────────────────────────────────────────────┘
         │
         │ (Transparent overlay)
         ▼
┌──────────────────────────────────────────────────────────┐
│         CHEATING DETECTION LAYER (NEW, ISOLATED)         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CheatingDetector        ✅ Monitors only               │
│  Warning Modal           ✅ Non-blocking display       │
│  Violation Logging       ✅ Records evidence            │
│  Reset Capability        ✅ New option for violations   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## File Dependencies

```
App.jsx
  │
  └── imports: MonitoredInterview.jsx
      │
      ├── imports: Interview.jsx
      │   ├── uses: axios (existing)
      │   ├── uses: react-router-dom (existing)
      │   └── no changes to logic
      │
      ├── imports: CheatingDetector.jsx
      │   ├── uses: face-api.js (CDN)
      │   ├── uses: Window APIs (native)
      │   └── no npm dependencies
      │
      └── imports: CheatingWarning.jsx
          ├── uses: react (existing)
          └── uses: Tailwind CSS (existing)
              │
              └── calls: useInterviewMonitoring.js
                  ├── uses: axios (existing)
                  └── calls: /api/interview/reset-interview
                  └── calls: /api/interview/log-violation

server/routes/interview.js
  └── NEW endpoints (non-disruptive)
      ├── POST /api/interview/reset-interview
      └── POST /api/interview/log-violation
```

---

## Browser APIs Used

```
✅ MediaDevices API       (Existing - webcam)
✅ Page Visibility API    (New - tab detection)
✅ Window Events API      (New - blur/focus)
✅ Keyboard Events API    (New - dev tools blocking)
✅ Mouse Events API       (New - device detection)
✅ DOM APIs              (Existing - element access)
✅ Canvas API            (face-api.js - face detection)
```

---

**Note**: This architecture ensures zero impact on existing functionality while providing comprehensive cheating detection. The modular design allows easy customization and future enhancements.
