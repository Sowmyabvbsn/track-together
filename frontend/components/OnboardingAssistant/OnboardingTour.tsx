"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  MapPin, 
  Users, 
  MessageSquare,
  Bell,
  Settings,
  Plus,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: React.ReactNode;
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  '/dashboard': [
    {
      id: 'welcome',
      title: 'Welcome to RiderConnect! 🎉',
      description: 'Let me show you around. This is your dashboard where you can see all your group rides and create new ones.',
      target: 'dashboard-header',
      icon: <MapPin className="h-4 w-4" />,
      position: 'bottom'
    },
    {
      id: 'create-group',
      title: 'Create New Groups',
      description: 'Click here to create a new group ride. You can set your route, timing, and invite friends!',
      target: 'create-group-card',
      icon: <Plus className="h-4 w-4" />,
      position: 'top'
    },
    {
      id: 'join-group',
      title: 'Join Existing Groups',
      description: 'Have an invite code? Use this to join groups created by your friends.',
      target: 'join-group-card',
      icon: <Users className="h-4 w-4" />,
      position: 'top'
    },
    {
      id: 'navigation',
      title: 'Navigation Menu',
      description: 'Use the navigation bar to access Groups, Notifications, and other features.',
      target: 'navbar',
      icon: <Settings className="h-4 w-4" />,
      position: 'bottom'
    }
  ],
  '/groups': [
    {
      id: 'groups-overview',
      title: 'Your Groups',
      description: 'Here you can see all your active and past group rides with detailed information.',
      target: 'groups-header',
      icon: <Users className="h-4 w-4" />,
      position: 'bottom'
    }
  ],
  '/notifications': [
    {
      id: 'notifications-overview',
      title: 'Stay Updated',
      description: 'All your notifications appear here. You can mark them as read and filter by type.',
      target: 'notifications-header',
      icon: <Bell className="h-4 w-4" />,
      position: 'bottom'
    }
  ]
};

export default function OnboardingTour({ isActive, onComplete, onSkip }: OnboardingTourProps) {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(0);
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);

  useEffect(() => {
    const steps = TOUR_STEPS[pathname] || [];
    setTourSteps(steps);
    setCurrentStep(0);
  }, [pathname]);

  useEffect(() => {
    if (!isActive || tourSteps.length === 0) return;

    // Highlight the target element
    const targetElement = document.querySelector(`[data-tour="${tourSteps[currentStep]?.target}"]`);
    if (targetElement) {
      targetElement.classList.add('tour-highlight');
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      // Remove highlight from all elements
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };
  }, [isActive, currentStep, tourSteps]);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isActive || tourSteps.length === 0) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onSkip} />
      
      {/* Tour Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <Card className="shadow-2xl border-primary/20 bg-background">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    {step.icon}
                  </div>
                  <Badge variant="secondary">
                    Step {currentStep + 1} of {tourSteps.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSkip}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground mb-6">{step.description}</p>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {tourSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === currentStep ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextStep}
                  className="flex items-center gap-2"
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full text-sm"
                >
                  Skip tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Tour Styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `}</style>
    </>
  );
}

function cn(...classes: any[]): string {
  return classes.filter(Boolean).join(' ');
}