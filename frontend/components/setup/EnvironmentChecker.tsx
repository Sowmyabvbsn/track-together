"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Settings, 
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { getEnvironmentStatus } from '@/lib/env-validation';
import { useToast } from '@/hooks/use-toast';

export default function EnvironmentChecker() {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const status = getEnvironmentStatus();
    setEnvStatus(status);
  }, []);

  const copySetupGuide = () => {
    const guide = `
# RiderConnect Setup Guide

## Required Setup:

1. **Clerk Authentication**
   - Visit: https://dashboard.clerk.com/
   - Create application
   - Copy: Publishable Key & Secret Key

2. **LocationIQ (Geocoding)**
   - Visit: https://locationiq.com/
   - Sign up for free
   - Copy: API Key

## Optional Setup:

3. **OpenAI (AI Features)**
   - Visit: https://platform.openai.com/
   - Create account & add billing
   - Copy: API Key

4. **Mapbox (Advanced Mapping)**
   - Visit: https://account.mapbox.com/
   - Get access token

## Setup Steps:
1. Copy .env.example to .env.local
2. Fill in your API keys
3. Restart development server
    `;
    
    navigator.clipboard.writeText(guide);
    toast({
      title: "Setup Guide Copied!",
      description: "Paste this guide to help with environment setup"
    });
  };

  if (!envStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-2">Checking environment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card className={envStatus.isValid ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {envStatus.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Environment Status
            <Badge variant={envStatus.isValid ? 'default' : 'destructive'}>
              {envStatus.isValid ? 'Ready' : 'Needs Setup'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!envStatus.isValid && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {envStatus.error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copySetupGuide}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Setup Guide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Status */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(envStatus.features || {}).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <Badge variant={enabled ? 'default' : 'secondary'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {envStatus.warnings && envStatus.warnings.length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-yellow-600">Warnings:</h4>
                {envStatus.warnings.map((warning: string, index: number) => (
                  <Alert key={index} className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setup Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'Clerk Dashboard', url: 'https://dashboard.clerk.com/', description: 'Authentication (Required)' },
              { name: 'LocationIQ', url: 'https://locationiq.com/', description: 'Geocoding (Required)' },
              { name: 'OpenAI Platform', url: 'https://platform.openai.com/', description: 'AI features (Optional)' },
              { name: 'Mapbox', url: 'https://account.mapbox.com/', description: 'Advanced mapping (Optional)' },
            ].map((link) => (
              <Button
                key={link.name}
                variant="outline"
                className="justify-start h-auto p-3"
                onClick={() => window.open(link.url, '_blank')}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{link.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                  <div className="text-xs text-muted-foreground">{link.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}