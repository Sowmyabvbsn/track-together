'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, MapPin, MessageSquare, Search, Navigation, Volume2 } from 'lucide-react';
import { ollamaClient } from '@/lib/ollama-client';

interface VoiceActionCommandsProps {
  groupId: string;
  onShowMap: () => void;
  onSendMessage: (message: string) => void;
  onSearchPlaces: (query: string) => void;
  currentLocation?: { lat: number; lng: number };
}

interface CommandResult {
  action: string;
  message: string;
  timestamp: Date;
}

export function VoiceActionCommands({
  groupId,
  onShowMap,
  onSendMessage,
  onSearchPlaces,
  currentLocation
}: VoiceActionCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<CommandResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTranscript(transcript);
          processVoiceCommand(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`Recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;

    setError(null);
    setTranscript('');
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError('Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const processVoiceCommand = async (command: string) => {
    setProcessing(true);
    setError(null);

    try {
      const lowerCommand = command.toLowerCase();

      if (lowerCommand.includes('where is everyone') || lowerCommand.includes('show map')) {
        onShowMap();
        addResult('Showing map', 'Displayed group member locations on map');
        speak('Showing everyone on the map');
        return;
      }

      if (
        lowerCommand.includes('running late') ||
        lowerCommand.includes('tell the group') ||
        lowerCommand.includes('send message')
      ) {
        const message = await generateContextualMessage(command);
        onSendMessage(message);
        addResult('Message sent', message);
        speak('Message sent to the group');
        return;
      }

      if (
        lowerCommand.includes('find') ||
        lowerCommand.includes('coffee') ||
        lowerCommand.includes('restaurant') ||
        lowerCommand.includes('nearby')
      ) {
        const searchQuery = extractSearchQuery(command);
        await findNearbyPlaces(searchQuery);
        return;
      }

      const aiResponse = await handleGeneralCommand(command);
      addResult('AI Response', aiResponse);
      speak(aiResponse);

    } catch (error) {
      console.error('Command processing error:', error);
      setError('Failed to process command');
    } finally {
      setProcessing(false);
    }
  };

  const generateContextualMessage = async (command: string): Promise<string> => {
    try {
      const locationContext = currentLocation
        ? `Current location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
        : '';

      const prompt = `User said: "${command}"

${locationContext}

Generate a natural, casual message to send to their group chat based on what they said. Keep it brief and friendly.`;

      const result = await ollamaClient.generate(prompt);
      return result.response.trim();
    } catch (error) {
      return "Hey everyone, just wanted to send a quick update!";
    }
  };

  const extractSearchQuery = (command: string): string => {
    const patterns = [
      /find (.*?) nearby/i,
      /search for (.*)/i,
      /look for (.*)/i,
      /(coffee|restaurant|gas station|pharmacy|parking)/i
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return command;
  };

  const findNearbyPlaces = async (query: string) => {
    if (!currentLocation) {
      addResult('Location needed', 'Enable location to search nearby places');
      speak('Please enable location sharing first');
      return;
    }

    try {
      onSearchPlaces(query);
      addResult('Searching', `Looking for ${query} nearby...`);
      speak(`Searching for ${query} near you`);
    } catch (error) {
      console.error('Search error:', error);
      addResult('Search failed', 'Could not search nearby places');
    }
  };

  const handleGeneralCommand = async (command: string): Promise<string> => {
    try {
      const prompt = `You are a helpful group travel assistant. A user said: "${command}"

Provide a brief, helpful response (1-2 sentences). If it's a question, answer it. If it's a request, acknowledge it.`;

      const result = await ollamaClient.generate(prompt);
      return result.response.trim();
    } catch (error) {
      return "I'm here to help! Try commands like 'Where is everyone?' or 'Find coffee nearby'";
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const addResult = (action: string, message: string) => {
    setResults(prev => [
      {
        action,
        message,
        timestamp: new Date()
      },
      ...prev.slice(0, 4)
    ]);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Commands
          </CardTitle>
          <CardDescription>
            Voice recognition not supported in this browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Try using Chrome, Edge, or Safari for voice command support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Commands
        </CardTitle>
        <CardDescription>
          Control the app with voice commands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            variant={isListening ? 'destructive' : 'default'}
            onClick={isListening ? stopListening : startListening}
            disabled={processing}
            className="h-20 w-20 rounded-full"
          >
            {isListening ? (
              <MicOff className="h-8 w-8 animate-pulse" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>

          {isListening && (
            <Badge variant="default" className="animate-pulse">
              Listening...
            </Badge>
          )}

          {processing && (
            <Badge variant="secondary">
              Processing command...
            </Badge>
          )}

          {transcript && (
            <Card className="w-full bg-secondary/30">
              <CardContent className="pt-3 pb-3">
                <p className="text-sm text-center">"{transcript}"</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="w-full border-destructive bg-destructive/10">
              <CardContent className="pt-3 pb-3">
                <p className="text-sm text-destructive text-center">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Try saying:</h4>
          <div className="space-y-1">
            {[
              { icon: MapPin, text: '"Where is everyone?"' },
              { icon: MessageSquare, text: '"Tell the group I\'m running late"' },
              { icon: Search, text: '"Find coffee shops nearby"' },
              { icon: Navigation, text: '"Navigate to destination"' }
            ].map((example, index) => (
              <Card key={index} className="hover:bg-secondary/50 transition-colors">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-2">
                    <example.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{example.text}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Recent Actions
            </h4>
            {results.map((result, index) => (
              <Card key={index} className="bg-primary/5">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium mb-1">{result.action}</h5>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(result.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
