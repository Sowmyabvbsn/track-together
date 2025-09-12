"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Brain, 
  Volume2,
  VolumeX,
  Settings,
  Zap,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedVoiceService } from '@/lib/ai-voice-enhanced';
import { useToast } from '@/hooks/use-toast';

interface AIVoiceCommandsProps {
  groupId: string;
  groupData: any;
  onCommandExecuted: (command: any) => void;
}

interface VoiceCommand {
  id: string;
  command: string;
  description: string;
  example: string;
  category: 'navigation' | 'communication' | 'emergency' | 'status';
}

const VOICE_COMMANDS: VoiceCommand[] = [
  {
    id: 'share-location',
    command: 'Share my location',
    description: 'Broadcasts your current location to the group',
    example: 'Share my location',
    category: 'communication'
  },
  {
    id: 'emergency',
    command: 'Emergency help',
    description: 'Triggers emergency protocol and alerts',
    example: 'Emergency, I need help',
    category: 'emergency'
  },
  {
    id: 'eta',
    command: 'Share ETA',
    description: 'Calculates and shares your estimated arrival time',
    example: 'What\'s my ETA?',
    category: 'navigation'
  },
  {
    id: 'status',
    command: 'Group status',
    description: 'Gets current status of all group members',
    example: 'Show group status',
    category: 'status'
  }
];

export default function AIVoiceCommands({
  groupId,
  groupData,
  onCommandExecuted
}: AIVoiceCommandsProps) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lastCommand, setLastCommand] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    EnhancedVoiceService.initialize();
  }, []);

  const startListening = async () => {
    if (!voiceEnabled) {
      toast({
        title: 'Voice Commands Disabled',
        description: 'Enable voice commands in settings to use this feature',
        variant: 'destructive'
      });
      return;
    }

    setIsListening(true);
    setIsProcessing(false);

    try {
      await EnhancedVoiceService.processVoiceCommand(
        (result) => {
          setIsListening(false);
          setIsProcessing(true);
          setConfidence(result.confidence);
          
          setTimeout(() => {
            processVoiceCommand(result);
            setIsProcessing(false);
          }, 1000);
        },
        (error) => {
          setIsListening(false);
          toast({
            title: 'Voice Recognition Error',
            description: error,
            variant: 'destructive'
          });
        },
        { groupId, groupData }
      );
    } catch (error) {
      setIsListening(false);
      toast({
        title: 'Voice Command Failed',
        description: 'Unable to start voice recognition',
        variant: 'destructive'
      });
    }
  };

  const processVoiceCommand = async (result: any) => {
    setLastCommand(result);
    
    if (speechEnabled) {
      await EnhancedVoiceService.speak(
        result.analysis.response,
        { useOpenAI: true }
      );
    }

    onCommandExecuted(result);

    toast({
      title: 'Voice Command Executed',
      description: result.analysis.response
    });
  };

  const stopListening = () => {
    setIsListening(false);
    setIsProcessing(false);
  };

  const testVoiceCommand = async (command: VoiceCommand) => {
    const mockResult = {
      transcript: command.example,
      confidence: 0.95,
      analysis: {
        intent: { primary: command.category, confidence: 0.9 },
        actions: [{ type: command.id, priority: 'medium', data: {} }],
        response: `Executing ${command.description.toLowerCase()}`,
        needsConfirmation: false
      },
      timestamp: new Date().toISOString()
    };

    await processVoiceCommand(mockResult);
  };

  return (
    <div className="space-y-4">
      {/* Voice Control Panel */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            AI Voice Commands
            <Badge variant={voiceEnabled ? 'default' : 'secondary'} className="ml-auto">
              {voiceEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Voice Controls */}
            <div className="flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!voiceEnabled || isProcessing}
                  className={`h-20 w-20 rounded-full ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="h-8 w-8" />
                  ) : (
                    <Mic className="h-8 w-8" />
                  )}
                </Button>
              </motion.div>
            </div>

            <div className="text-center">
              <div className="text-sm font-medium">
                {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
              </div>
              <div className="text-xs text-muted-foreground">
                {isListening ? 'Say a command clearly' : 'Voice commands are ready'}
              </div>
            </div>

            {/* Processing Status */}
            <AnimatePresence>
              {(isListening || isProcessing) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <Progress 
                    value={isListening ? 50 : isProcessing ? 75 : 0} 
                    className="h-1" 
                  />
                  <div className="text-center text-xs text-muted-foreground">
                    {isListening ? 'Listening for voice input...' : 'AI is processing your command...'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Last Command Result */}
            {lastCommand && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Last Command</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(confidence * 100)}% confidence
                  </Badge>
                </div>
                <div className="text-sm">
                  <div className="font-medium">"{lastCommand.transcript}"</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {lastCommand.analysis.response}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Voice Input</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    className="h-8 w-8"
                  >
                    {voiceEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Voice Output</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className="h-8 w-8"
                  >
                    {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Commands */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Available Voice Commands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VOICE_COMMANDS.map((command) => (
              <motion.div
                key={command.id}
                whileHover={{ scale: 1.02 }}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{command.command}</span>
                  <Badge variant="outline" className="text-xs">
                    {command.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {command.description}
                </p>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    "{command.example}"
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testVoiceCommand(command)}
                    className="text-xs h-6"
                  >
                    Test
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}