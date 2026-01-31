# Interactive Tutorial System - Documentation

## Overview

A comprehensive interactive tutorial system has been implemented for new users. When users login for the first time, they'll automatically see an engaging tutorial that walks them through the key features of the AI Research Agent platform.

## Features

### 1. **Auto-Start on First Login**
- Tutorial automatically appears on user's first login
- Progress is tracked per user in localStorage
- Users can skip or complete the tutorial
- Tutorial can be restarted anytime from the Dashboard help button

### 2. **Interactive Steps**
The tutorial contains 9 guided steps:

1. **Welcome** - Introduction to the platform
2. **Creating Your First Agent** - How to create agents (highlights the "New Agent" button)
3. **Configure Your Agent** - Details about agent configuration options
4. **Agent Card Overview** - Explanation of agent card components and stats
5. **Start a Conversation** - How to chat with agents
6. **Chat Interface** - Features of the conversation interface
7. **View Analytics** - How to access performance metrics
8. **Quick Actions** - Using quick action shortcuts
9. **Completion** - Congratulations and next steps

### 3. **Interactive Highlighting**
- Spotlight effect highlights relevant UI elements
- Smooth scrolling to focused elements
- Semi-transparent overlay with clear element box
- Prevents accidental clicks outside the highlighted area

### 4. **Rich Navigation**
- Previous/Next buttons to move through steps
- Skip tutorial button to exit anytime
- Progress bar showing tutorial completion percentage
- Step indicators showing current position
- Step dots allowing navigation to previous steps

## Technical Implementation

### Files Created/Modified

#### 1. **Context: [TutorialContext.tsx](../context/TutorialContext.tsx)**
- Manages tutorial state globally
- Tracks current step, completion status, and user preferences
- Provides hooks for tutorial control
- Defines all 9 tutorial steps with detailed instructions

```typescript
// Usage in components
const { showTutorial, currentStep, startTutorial, nextStep } = useTutorial();
```

#### 2. **Component: [TutorialModal.tsx](../components/TutorialModal.tsx)**
- Renders the tutorial UI
- Implements spotlight effect using SVG mask
- Handles element highlighting and scrolling
- Responsive design (positions modal on right for large screens)

#### 3. **Types: [types/index.ts](../types/index.ts)**
- Added `TutorialStep` interface - represents each tutorial step
- Added `TutorialState` interface - tracks tutorial progress

#### 4. **App Integration: [App.tsx](../App.tsx)**
- Wrapped with `TutorialProvider`
- Renders `TutorialModal` component
- Provides tutorial context to all child components

#### 5. **Dashboard Updates: [Dashboard.tsx](../pages/Dashboard.tsx)**
- Added element IDs for tutorial targeting:
  - `new-agent-btn` - Quick Create button
  - `agent-cards-container` - Agent cards grid
  - `agent-chat-button` - Chat action (in AgentCard)
  - `analytics-tab` - Analytics navigation
  - `quick-actions` - Quick actions panel
- Added help button to manually restart tutorial
- Integrated `useTutorial` hook

#### 6. **QuickActions Updates: [QuickActions.tsx](../components/QuickActions.tsx)**
- Added `quick-actions` ID for tutorial targeting

## How It Works

### Tutorial Flow

1. **First Login**: User logs in
   - App checks localStorage for `tutorial_seen_{userId}`
   - If not found, tutorial auto-starts

2. **Tutorial Display**: Modal appears with:
   - Step title and description
   - Detailed step-by-step instructions
   - Progress indicator
   - Navigation buttons

3. **Element Highlighting**: When a step targets an element:
   - SVG mask creates spotlight effect
   - Element gets border highlight
   - Page scrolls to show element
   - Semi-transparent overlay focuses attention

4. **Completion**: After last step or skip:
   - `tutorial_seen_{userId}` saved to localStorage
   - Tutorial closes
   - `showTutorial` state set to false

5. **Restart**: User can click help icon in Dashboard header to restart

### Step Data Structure

```typescript
interface TutorialStep {
  id: string;                    // Unique identifier
  title: string;                 // Step title
  description: string;           // Main description
  detailedInstructions: string[];// Step-by-step instructions
  elementId?: string;            // DOM element ID to highlight
  action?: string;               // Action type (highlight, intro, guide, etc.)
  image?: string;                // Optional image/GIF (future use)
}
```

## Customization Guide

### Adding New Steps

1. Add step to `TUTORIAL_STEPS` array in `TutorialContext.tsx`:

```typescript
{
  id: 'my-new-step',
  title: 'My New Feature',
  description: 'Learn about this feature',
  detailedInstructions: [
    'Step 1',
    'Step 2',
    'Step 3'
  ],
  elementId: 'element-to-highlight',
  action: 'highlight'
}
```

2. Add ID to corresponding element in component:

```tsx
<button id="element-to-highlight">My Feature</button>
```

3. Tutorial will automatically include the new step

### Modifying Steps

Edit `TUTORIAL_STEPS` in `TutorialContext.tsx` to update:
- Titles and descriptions
- Instructions
- Highlighted elements
- Number of steps

### Styling

Tutorial modal styling in `TutorialModal.tsx`:
- Colors: Update Tailwind classes (`bg-blue-600`, `text-gray-900`, etc.)
- Position: Modify position logic in JSX
- Animation: Add transition classes as needed
- Spotlight: Modify SVG mask in useEffect

## User Experience

### For New Users
- Automatic guidance through platform features
- Clear visual highlighting of interactive elements
- Option to skip anytime
- Can restart by clicking help icon

### For Existing Users
- Tutorial marked as seen, won't auto-start
- Help icon always available to restart
- Per-user tracking prevents repeated tutorials

### Accessibility
- Clear text instructions
- Visual highlights
- Numbered steps
- Progress indicator
- Keyboard-friendly navigation (buttons)

## Future Enhancements

1. **Video/GIF Support**: Add `image` field to show visual examples
2. **Interactive Actions**: Allow tutorial to trigger actual actions (e.g., "Create an agent")
3. **Multi-Language Support**: Translate tutorial steps
4. **Analytics**: Track which steps users complete/skip
5. **Conditional Steps**: Show different tutorials based on user type
6. **Animations**: Add transitions and animations to steps
7. **Accessibility**: Add ARIA labels and keyboard navigation
8. **Mobile Optimization**: Adjust spotlight for mobile screens

## Testing

To test the tutorial:

1. **First Time**: Clear localStorage, login, tutorial auto-starts
2. **Restart**: Click help icon in Dashboard header
3. **Navigation**: Use Next/Previous/Skip buttons
4. **Highlighting**: Click through steps with elements to see spotlight
5. **Step Dots**: Click previous steps using dot indicators

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Basic support (spotlight adjusted for smaller screens)

## Performance Considerations

- Tutorial context minimal overhead
- SVG mask rendering is performant
- Element highlighting uses requestAnimationFrame for smooth scrolling
- localStorage used for persistence (fast local access)
- No additional API calls needed

---

**Last Updated**: January 10, 2026
**Tutorial Maintainer**: Update TUTORIAL_STEPS in TutorialContext.tsx
