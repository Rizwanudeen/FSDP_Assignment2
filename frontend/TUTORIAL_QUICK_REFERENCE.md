# Tutorial System - Quick Reference

## Usage in Components

### Show Tutorial on User Action
```typescript
import { useTutorial } from '../context/TutorialContext';

function MyComponent() {
  const { startTutorial } = useTutorial();
  
  return (
    <button onClick={startTutorial}>Help</button>
  );
}
```

### Access Tutorial State
```typescript
const { 
  showTutorial,           // boolean - is tutorial visible
  currentStep,            // number - current step index
  tutorialSteps,          // TutorialStep[] - all steps
  hasSeenTutorial,        // boolean - has user completed before
  isHighlighting,         // boolean - is current step highlighting element
  nextStep,               // function - go to next step
  prevStep,               // function - go to previous step
  goToStep,               // function - jump to specific step
  completeTutorial,       // function - mark as complete
  skipTutorial            // function - skip/close tutorial
} = useTutorial();
```

## Adding Highlighting to Elements

### Step 1: Add ID to Element
```tsx
<div id="my-feature-element">
  This element will be highlighted
</div>
```

### Step 2: Add Step in TutorialContext.tsx
```typescript
{
  id: 'feature-step',
  title: 'My Feature',
  description: 'Learn how to use this feature',
  detailedInstructions: [
    'Step 1 instructions',
    'Step 2 instructions'
  ],
  elementId: 'my-feature-element',  // Matches element ID
  action: 'highlight'
}
```

## Tutorial File Locations

```
frontend/src/
├── context/
│   └── TutorialContext.tsx      # State management & steps definition
├── components/
│   └── TutorialModal.tsx        # UI component
├── types/
│   └── index.ts                 # TypeScript interfaces
├── pages/
│   └── Dashboard.tsx            # Integration example
└── TUTORIAL_DOCUMENTATION.md    # Full documentation
```

## Common Tasks

### Change Tutorial Content
Edit `TUTORIAL_STEPS` in `frontend/src/context/TutorialContext.tsx`

### Add New Element to Tutorial
1. Add `id="something"` to element
2. Add step with `elementId: 'something'` to `TUTORIAL_STEPS`

### Disable Tutorial for User
```typescript
const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
localStorage.setItem(`tutorial_seen_${userId}`, 'true');
```

### Reset Tutorial for User
```typescript
const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
localStorage.removeItem(`tutorial_seen_${userId}`);
```

### Modify Step Styling
Edit `TutorialModal.tsx`:
- Colors: Update Tailwind classes
- Position: Change `bottom-8 right-8` positioning
- Size: Modify `max-w-md` or padding

## Tutorial Steps Overview

| Step | Title | Element Highlighted | Purpose |
|------|-------|-------------------|---------|
| 0 | Welcome | None | Introduction |
| 1 | Creating Agents | `new-agent-btn` | Show create button |
| 2 | Configure Agent | None | Explain options |
| 3 | Agent Card | `agent-cards-container` | Show agent layout |
| 4 | Start Chat | `agent-chat-button` | Show chat button |
| 5 | Chat Interface | None | Explain chat UI |
| 6 | Analytics | `analytics-tab` | Show analytics button |
| 7 | Quick Actions | `quick-actions` | Show quick actions |
| 8 | Completion | None | Congratulations |

## Key Features

✅ **Auto-start on first login**
✅ **Spotlight highlighting with SVG mask**
✅ **Per-user progress tracking**
✅ **Skip anytime**
✅ **Restart from help icon**
✅ **Smooth scrolling to elements**
✅ **Step navigation (prev/next/jump)**
✅ **Progress bar and indicators**
✅ **Detailed instructions per step**

## Troubleshooting

### Tutorial Not Showing on Login
1. Check localStorage: `tutorial_seen_{userId}` should not exist
2. Verify user ID is properly set in localStorage
3. Check browser console for errors

### Element Not Highlighting
1. Verify element ID exists in DOM
2. Check element ID matches `elementId` in step
3. Ensure element is not hidden/display:none
4. Check z-index conflicts

### Modal Position Wrong
1. Edit positioning in `TutorialModal.tsx` line ~134
2. Adjust `bottom-8 right-8` classes
3. Modify conditional rendering for different layouts

### Spotlight Not Working
1. Check SVG mask calculation in useEffect
2. Verify element is visible on page
3. Check browser DevTools for SVG rendering

## Performance Tips

- Tutorial context has minimal overhead
- SVG rendering is efficient (one mask)
- localStorage access is instant
- No API calls needed
- Lazy component loads with modal

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11 (not supported)

---

**Quick Start**: Click help icon (?) in Dashboard to see tutorial in action!
