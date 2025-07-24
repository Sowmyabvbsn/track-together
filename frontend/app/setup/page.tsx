"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Zap } from 'lucide-react';
import Link from 'next/link';
import EnvironmentChecker from '@/components/setup/EnvironmentChecker';
import OnboardingProgress from '@/components/OnboardingAssistant/OnboardingProgress';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Environment Setup</h1>
              <p className="text-muted-foreground">
                Configure API keys and enable AI features
              </p>
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-blue-100 dark:bg-blue-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="font-medium mb-2">Copy Environment File</h3>
                <p className="text-sm text-muted-foreground">
                  Copy <code>.env.example</code> to <code>.env.local</code>
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-green-100 dark:bg-green-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <h3 className="font-medium mb-2">Get API Keys</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up for required services and get API keys
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-purple-100 dark:bg-purple-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <h3 className="font-medium mb-2">Configure & Test</h3>
                <p className="text-sm text-muted-foreground">
                  Add keys to .env.local and restart server
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Checker */}
        <EnvironmentChecker />

        {/* Onboarding Progress */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          <OnboardingProgress />
        </div>
      </div>
    </div>
  );
}