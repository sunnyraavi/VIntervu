# Quick Setup & API Reference

## Installation & Running

No additional npm packages needed! The implementation uses:
- Existing packages from your project
- face-api.js loaded from CDN (no installation)

### Run the Application:

```bash
# Client
cd client
npm install  # if needed
npm run dev

# Server (in another terminal)
cd server
npm install  # if needed
npm start
```

## API Reference - New Endpoints

### 1. Reset Interview
**Endpoint**: `POST /api/interview/reset-interview`

**Purpose**: Triggered when user clicks "Restart Interview" button on cheating warning

**Request**:
```json
// No body required
```

**Response**:
```json
{
  "success": true,
  "message": "Interview will be reset. Please wait for the page to reload."
}
```

**Usage in Frontend**:
```javascript
import { useInterviewReset } from '../hooks/useInterviewMonitoring';

const { resetInterview } = useInterviewReset();
resetInterview(); // Calls endpoint and reloads page
```

---

### 2. Log Violation
**Endpoint**: `POST /api/interview/log-violation`

**Purpose**: Records cheating violations for audit trail and analytics

**Request**:
```json
{
  "type": "no_face_detected",           // or: tab_switch, multiple_faces, etc.
  "message": "⚠️ Face not visible!...",  // User-facing message
  "severity": "high",                    // high, medium, low
  "timestamp": "2024-02-12T10:30:45Z"   // ISO timestamp
}
```

**Response**:
```json
{
  "success": true,
  "message": "Violation logged for audit trail"
}
```

**Usage in Frontend**:
```javascript
import { logViolation } from '../hooks/useInterviewMonitoring';

logViolation({
  type: 'no_face_detected',
  message: 'Face not visible',
  severity: 'high'
});
```

**Violation Types**:
- `no_face_detected` - User's face not visible in camera
- `multiple_faces` - More than one person detected
- `tab_switch` - User switched to another tab
- `window_blur` - User clicked outside browser window
- `external_device` - Unusual input device detected
- `dev_tools_attempt` - User tried opening developer tools
- `suspicious_action` - User right-clicked or other suspicious action

---

## Environment Variables

No new environment variables needed. Existing setup should work fine.

### Optional Production Setup

To store violations in database (future enhancement):

```javascript
// In server/routes/interview.js
// Uncomment and set up violation logging:

// const Violation = require('../models/Violation'); // Create this model

router.post('/log-violation', async (req, res, next) => {
  try {
    const { type, message, severity, timestamp } = req.body;
    
    // Save to database
    await Violation.create({
      type,
      message,
      severity,
      timestamp,
      userId: req.session?.userId // if you add authentication
    });
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
```

---

## Configuration & Customization

### 1. Adjust Detection Sensitivity

**File**: `src/components/MonitoredInterview.jsx`

```jsx
<CheatingDetector
  webcamRef={webcamRef}
  onCheatingDetected={handleCheatingDetected}
  faceDetectionInterval={3000}  // Change to detect more/less frequently
                                // Lower = more frequent checks, higher load
                                // Higher = less checks, may miss violations
/>
```

### 2. Customize Warning UI

**File**: `src/components/CheatingWarning.jsx`

Change colors:
```jsx
// Line with color class
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'high':
      return 'bg-red-500';        // Change red to your color
    case 'medium':
      return 'bg-orange-500';     // Change orange
    case 'low':
      return 'bg-yellow-500';     // Change yellow
    default:
      return 'bg-gray-500';
  }
};
```

Change auto-close time:
```jsx
// Line in useEffect
const timer = setTimeout(() => {
  setIsVisible(false);
  onDismiss();
}, 4000);  // Change 4000 to desired milliseconds
```

### 3. Disable Specific Checks

**File**: `src/components/CheatingDetector.jsx`

Comment out the feature:

```jsx
// To disable face detection:
// useEffect(() => { ... }, [faceDetectionModel, ...])

// To disable tab switching:
// useEffect(() => {
//   const handleVisibilityChange = () => { ... };
//   ...
// }, [])

// To disable dev tools blocking:
// useEffect(() => {
//   const handleKeyDown = (e) => { ... };
//   ...
// }, [])
```

---

## Testing Violations

### Manual Testing

```bash
# 1. Start your server and client
npm run dev  # in client/
npm start    # in server/ (separate terminal)

# 2. Navigate to /interview
# 3. Test each violation:
```

| Violation | How to Test |
|-----------|------------|
| No face detected | Move your face out of camera |
| Multiple faces | Have another person in frame |
| Tab switch | Click another browser tab |
| Window blur | Click desktop/another application |
| Dev tools | Press F12 or Ctrl+Shift+I |
| External device | (Difficult to trigger manually) |
| Right-click block | Try right-clicking anywhere |

### Automated Testing (Future)

```javascript
// Example test file for CheatingDetector
const testViolation = async (violationType) => {
  const violations = [];
  
  const handleViolation = (data) => {
    violations.push(data);
  };
  
  // Render component and trigger violation...
  
  assert(violations.length > 0);
  assert(violations[0].type === violationType);
};
```

---

## Monitoring & Debugging

### Console Logs

Enable debug logs by searching for `console.log` and `console.error` in:
- `CheatingDetector.jsx` - Face detection logs
- `CheatingWarning.jsx` - Warning display logs
- `MonitoredInterview.jsx` - Override/dismiss logs
- `server/routes/interview.js` - Server-side logs

### Browser DevTools

1. Open DevTools (though users can't during interview!)
2. Check Console tab for violation logs
3. Check Network tab for violation POST requests
4. Check Application > Session Storage for any stored data

### Server Logs

Check server console for:
```
[VIOLATION LOGGED] Type: no_face_detected, Severity: high
Interview reset requested...
```

---

## Common Issues & Solutions

### Issue: Face detection not triggering
**Solution**: 
- Verify webcam permission granted
- Check face-api CDN accessibility
- Try different lighting
- Face needs to be clearly visible

### Issue: Too many warnings
**Solution**:
- Increase `faceDetectionInterval` from 3000 to 5000+ ms
- Adjust confidence threshold in CheatingDetector

### Issue: Warning modal stuck
**Solution**:
- Manually close by clicking "Acknowledge"
- Refresh page if completely stuck

### Issue: Reset not working
**Solution**:
- Check server logs for errors
- Verify endpoint `/api/interview/reset-interview` is registered
- Check browser console for network errors

---

## Security Considerations

1. **Client-Side Only**: Detection happens in browser
2. **No Video Storage**: Webcam feed never sent to server
3. **Violations Logged**: Server knows about violations (if enabled)
4. **Cannot Be Disabled**: User cannot disable from browser (feature in WebWorker)

---

## Next Steps

1. ✅ Test all violation types
2. ✅ Customize colors/messages for your brand
3. ✅ Setup database for violation storage (optional)
4. ✅ Configure detection sensitivity
5. ✅ Add admin dashboard for review (optional)
6. ✅ Deploy to production

---

**Questions?** Check `CHEATING_DETECTION_GUIDE.md` for detailed documentation.
