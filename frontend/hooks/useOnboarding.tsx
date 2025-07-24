"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface OnboardingState {
  hasSeenTour: boolean;
  hasCreatedFirstGroup: boolean;
  hasJoinedFirstGroup: boolean;
  hasUsedChat: boolean;
  hasViewedNotifications: boolean;
  completedAt?: Date;
}

export function useOnboarding() {
  const { user, isLoaded } = useUser();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasSeenTour: false,
    hasCreatedFirstGroup: false,
    hasJoinedFirstGroup: false,
    hasUsedChat: false,
    hasViewedNotifications: false,
  });
  const [showTour, setShowTour] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Load onboarding state from localStorage
    const savedState = localStorage.getItem(`onboarding-${user.id}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setOnboardingState(parsed);
        
        // Show tour for new users
        if (!parsed.hasSeenTour) {
          setShowTour(true);
        }
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
      }
    } else {
      // New user - show tour
      setShowTour(true);
    }
  }, [user, isLoaded]);

  const updateOnboardingState = (updates: Partial<OnboardingState>) => {
    if (!user) return;

    const newState = { ...onboardingState, ...updates };
    setOnboardingState(newState);
    
    // Save to localStorage
    localStorage.setItem(`onboarding-${user.id}`, JSON.stringify(newState));
  };

  const completeOnboarding = () => {
    updateOnboardingState({
      hasSeenTour: true,
      completedAt: new Date()
    });
    setShowTour(false);
  };

  const skipTour = () => {
    updateOnboardingState({ hasSeenTour: true });
    setShowTour(false);
  };

  const markMilestone = (milestone: keyof OnboardingState) => {
    updateOnboardingState({ [milestone]: true });
  };

  const resetOnboarding = () => {
    if (!user) return;
    
    localStorage.removeItem(`onboarding-${user.id}`);
    setOnboardingState({
      hasSeenTour: false,
      hasCreatedFirstGroup: false,
      hasJoinedFirstGroup: false,
      hasUsedChat: false,
      hasViewedNotifications: false,
    });
    setShowTour(true);
  };

  const isNewUser = () => {
    return !onboardingState.hasSeenTour && 
           !onboardingState.hasCreatedFirstGroup && 
           !onboardingState.hasJoinedFirstGroup;
  };

  const getProgress = () => {
    const milestones = [
      onboardingState.hasSeenTour,
      onboardingState.hasCreatedFirstGroup,
      onboardingState.hasJoinedFirstGroup,
      onboardingState.hasUsedChat,
      onboardingState.hasViewedNotifications,
    ];
    
    const completed = milestones.filter(Boolean).length;
    return Math.round((completed / milestones.length) * 100);
  };

  return {
    onboardingState,
    showTour,
    showChatbot,
    setShowChatbot,
    completeOnboarding,
    skipTour,
    markMilestone,
    resetOnboarding,
    isNewUser,
    getProgress,
    updateOnboardingState,
  };
}