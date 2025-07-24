"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Circle, 
  Trophy, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function OnboardingProgress() {
  const { onboardingState, getProgress, resetOnboarding } = useOnboarding();

  const milestones = [
    {
      key: 'hasSeenTour' as const,
      title: 'Completed Tour',
      description: 'Finished the app walkthrough',
      completed: onboardingState.hasSeenTour
    },
    {
      key: 'hasCreatedFirstGroup' as const,
      title: 'Created First Group',
      description: 'Set up your first group ride',
      completed: onboardingState.hasCreatedFirstGroup
    },
    {
      key: 'hasJoinedFirstGroup' as const,
      title: 'Joined a Group',
      description: 'Connected with other riders',
      completed: onboardingState.hasJoinedFirstGroup
    },
    {
      key: 'hasUsedChat' as const,
      title: 'Used Group Chat',
      description: 'Sent your first message',
      completed: onboardingState.hasUsedChat
    },
    {
      key: 'hasViewedNotifications' as const,
      title: 'Checked Notifications',
      description: 'Stayed updated with alerts',
      completed: onboardingState.hasViewedNotifications
    }
  ];

  const progress = getProgress();
  const completedCount = milestones.filter(m => m.completed).length;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Onboarding Progress
          {progress === 100 && (
            <Badge variant="default" className="ml-auto">
              <Trophy className="h-3 w-3 mr-1" />
              Complete!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{completedCount}/{milestones.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground text-center">
            {progress}% complete
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`flex-shrink-0 ${milestone.completed ? 'text-green-600' : 'text-muted-foreground'}`}>
                {milestone.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <div className={`font-medium text-sm ${milestone.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {milestone.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {milestone.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Completion Message */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 bg-gradient-to-r from-primary/10 to-purple/10 rounded-lg"
          >
            <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="font-medium text-primary">Congratulations!</div>
            <div className="text-sm text-muted-foreground">
              You've mastered RiderConnect! 🎉
            </div>
          </motion.div>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetOnboarding}
          className="w-full text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-2" />
          Reset Onboarding
        </Button>
      </CardContent>
    </Card>
  );
}