import React, { createContext, useContext, useState, useEffect } from 'react';
import { TutorialStep } from '../types';

interface TutorialContextType {
  showTutorial: boolean;
  currentStep: number;
  tutorialSteps: TutorialStep[];
  hasSeenTutorial: boolean;
  isHighlighting: boolean;
  startTutorial: () => void;
  skipTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AeroIntel!',
    description: 'Let\'s take a quick tour to help you get started with creating and managing AI agents.',
    detailedInstructions: [
      'This tutorial will guide you through the main features',
      'You can skip at any time by clicking "Skip Tutorial"',
      'Let\'s start by exploring the top navigation buttons'
    ],
    action: 'intro'
  },
  {
    id: 'header-buttons',
    title: 'Navigation Buttons',
    description: 'Here are the key buttons to manage your workflow.',
    detailedInstructions: [
      '🌙 Theme Toggle: Switch between light and dark mode',
      '👥 Teams: Collaborate with team members on agents',
      '💬 Test Agents: Test and interact with your agents',
      '✨ Agent Builder: Create and configure new AI agents',
      '❓ Help: View this tutorial anytime',
      '🚪 Logout: Sign out of your account'
    ],
    elementId: 'theme-toggle-btn',
    action: 'highlight'
  },
  {
    id: 'agent-builder',
    title: 'Creating Your First Agent',
    description: 'Click the "Agent Builder" button to create a new AI agent.',
    detailedInstructions: [
      'The "Agent Builder" button is in the top navigation bar',
      'Clicking it opens the agent configuration form',
      'You can customize your agent\'s name, description, and type',
      'Set the model, temperature, and system prompt as needed'
    ],
    elementId: 'agent-builder-btn',
    action: 'highlight'
  },
  {
    id: 'agent-config',
    title: 'Configure Your Agent',
    description: 'Fill in the agent details to customize its behavior.',
    detailedInstructions: [
      'Name: Give your agent a descriptive name (e.g., "Research Bot")',
      'Description: Explain what your agent specializes in',
      'Type: Choose from Conversational, Analytical, Creative, or Automation',
      'Advanced Options: Configure model parameters and prompts'
    ],
    action: 'guide'
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions Panel',
    description: 'Use quick action buttons to manage your workflow efficiently.',
    detailedInstructions: [
      '➕ Create New Agent: Start building a new agent',
      '💬 Test Agent: Interact with existing agents',
      '📊 View Analytics: Track agent performance metrics',
      '📝 Send Feedback: Share suggestions with the team',
      '👤 View Profile: Manage your account settings'
    ],
    elementId: 'quick-actions',
    action: 'highlight'
  },
  {
    id: 'search-filter',
    title: 'Search and Filter Agents',
    description: 'Find your agents quickly using search and filters.',
    detailedInstructions: [
      'Search Bar: Type agent name or description to find agents',
      'Type Filter: Filter by Conversational, Analytical, Creative, or Automation',
      'Status Filter: Show Active, Inactive, or view all agents',
      'Results: Your agents will appear as cards below'
    ],
    elementId: 'search-filter-section',
    action: 'highlight'
  },
  {
    id: 'analytics-button',
    title: 'View Analytics',
    description: 'Track your agent performance using the Analytics dashboard.',
    detailedInstructions: [
      'View metrics like total interactions and success rates',
      'See performance trends over time',
      'Export data for reports',
      'Monitor agent effectiveness'
    ],
    elementId: 'view-analytics-btn',
    action: 'highlight'
  },
  {
    id: 'feedback-button',
    title: 'Send Feedback',
    description: 'Share your suggestions and feedback with the team.',
    detailedInstructions: [
      'Click the "Give Feedback" button in quick actions',
      'Share your suggestions to help improve the platform',
      'Tell us what features you\'d like to see',
      'Report any issues you encounter'
    ],
    elementId: 'give-feedback-btn',
    action: 'highlight'
  },
  {
    id: 'profile-button',
    title: 'View Profile',
    description: 'Manage your account settings and preferences.',
    detailedInstructions: [
      'Click the "View Profile" button to access your account',
      'Update your personal information',
      'Configure notification preferences',
      'View your account activity'
    ],
    elementId: 'profile-btn',
    action: 'highlight'
  },
  {
    id: 'agent-card',
    title: 'Agent Card Overview',
    description: 'Each agent appears as a card with status and quick stats.',
    detailedInstructions: [
      'Card Header: Shows agent name and current status',
      'Stats: Displays success rate and total interactions',
      'Description: Shows the agent\'s purpose',
      'Buttons: Edit, chat, or delete the agent from the card'
    ],
    elementId: 'agent-cards-container',
    action: 'highlight'
  },
  {
    id: 'agent-actions',
    title: 'Agent Card Actions',
    description: 'Each agent card has action buttons for different tasks.',
    detailedInstructions: [
      '💬 Chat Button: Start a conversation with the agent',
      '✏️ Edit Button: Modify the agent\'s configuration',
      '🗑️ Delete Button: Remove the agent (cannot be undone)',
      'Click the card itself to view detailed information'
    ],
    action: 'guide'
  },
  {
    id: 'test-agents',
    title: 'Test Agents',
    description: 'Use the "Test Agents" button to interact with your agents in a dedicated interface.',
    detailedInstructions: [
      'Located in the top navigation bar',
      'Opens a chat interface to test agent responses',
      'Useful for debugging and validation',
      'Your test conversations are automatically saved'
    ],
    elementId: 'test-agents-btn',
    action: 'highlight'
  },
  {
    id: 'teams',
    title: 'Teams Collaboration',
    description: 'Collaborate with team members on shared agents.',
    detailedInstructions: [
      'Located in the top navigation bar',
      'Create teams to organize agents by project',
      'Share agents with team members',
      'Manage permissions and team access'
    ],
    elementId: 'teams-btn',
    action: 'highlight'
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    description: 'You now know the basics of using AeroIntel.',
    detailedInstructions: [
      '✅ Create your first agent using the Agent Builder',
      '✅ Test it using the Test Agents button',
      '✅ Invite team members to collaborate',
      '✅ Access this tutorial anytime by clicking the Help button'
    ],
    action: 'congratulations'
  }
];

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Check if user has seen tutorial before
  useEffect(() => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (userId) {
      const seen = localStorage.getItem(`tutorial_seen_${userId}`);
      setHasSeenTutorial(!!seen);
      
      // Show tutorial on first login if not seen before
      if (!seen) {
        setShowTutorial(true);
      }
    }
  }, []);

  const startTutorial = () => {
    setShowTutorial(true);
    setCurrentStep(0);
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < TUTORIAL_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const completeTutorial = () => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (userId) {
      localStorage.setItem(`tutorial_seen_${userId}`, 'true');
    }
    setShowTutorial(false);
    setHasSeenTutorial(true);
  };

  return (
    <TutorialContext.Provider
      value={{
        showTutorial,
        currentStep,
        tutorialSteps: TUTORIAL_STEPS,
        hasSeenTutorial,
        isHighlighting: TUTORIAL_STEPS[currentStep]?.elementId !== undefined,
        startTutorial,
        skipTutorial,
        nextStep,
        prevStep,
        goToStep,
        completeTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
