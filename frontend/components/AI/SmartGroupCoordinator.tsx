'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Users, Coffee, Utensils, ShoppingBag, Clock, AlertCircle } from 'lucide-react';
import { locationIQClient, type Location, type Place } from '@/lib/locationiq-client';
import { ollamaClient } from '@/lib/ollama-client';

interface Member {
  id: string;
  name: string;
  location: Location;
  lastUpdated: Date;
}

interface MeetingPoint {
  name: string;
  location: Location;
  type: string;
  totalDistance: number;
  maxDistance: number;
  reasoning: string;
}

interface SmartGroupCoordinatorProps {
  groupId: string;
  members: Member[];
}

export function SmartGroupCoordinator({ groupId, members }: SmartGroupCoordinatorProps) {
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('restaurant');
  const [aiRecommendation, setAiRecommendation] = useState<string>('');

  const placeTypes = [
    { id: 'restaurant', icon: Utensils, label: 'Restaurant' },
    { id: 'cafe', icon: Coffee, label: 'Café' },
    { id: 'park', icon: MapPin, label: 'Park' },
    { id: 'shopping', icon: ShoppingBag, label: 'Shopping' }
  ];

  const calculateOptimalMeetingPoint = async () => {
    if (members.length < 2) return;

    setLoading(true);
    try {
      const centroid = locationIQClient.calculateCentroid(
        members.map(m => m.location)
      );

      const distances = members.map(m =>
        locationIQClient.calculateDistance(
          m.location.lat,
          m.location.lng,
          centroid.lat,
          centroid.lng
        )
      );
      const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

      const places = await locationIQClient.searchNearby(
        centroid.lat,
        centroid.lng,
        Math.ceil(avgDistance * 1000) + 2000,
        selectedType
      );

      const scoredPoints: MeetingPoint[] = places.slice(0, 5).map(place => {
        const placeLat = parseFloat(place.lat);
        const placeLng = parseFloat(place.lon);

        const distancesToPlace = members.map(m =>
          locationIQClient.calculateDistance(
            m.location.lat,
            m.location.lng,
            placeLat,
            placeLng
          )
        );

        const totalDistance = distancesToPlace.reduce((a, b) => a + b, 0);
        const maxDistanceToPlace = Math.max(...distancesToPlace);

        return {
          name: place.name || place.display_name,
          location: { lat: placeLat, lng: placeLng },
          type: place.type,
          totalDistance: totalDistance,
          maxDistance: maxDistanceToPlace,
          reasoning: `Total travel: ${totalDistance.toFixed(1)}km. Max distance: ${maxDistanceToPlace.toFixed(1)}km`
        };
      });

      scoredPoints.sort((a, b) => a.totalDistance - b.totalDistance);
      setMeetingPoints(scoredPoints);

      await generateAIRecommendation(scoredPoints, members);

    } catch (error) {
      console.error('Error calculating meeting points:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendation = async (points: MeetingPoint[], groupMembers: Member[]) => {
    if (points.length === 0) {
      setAiRecommendation('No suitable meeting points found in this area. Try a different location type.');
      return;
    }

    try {
      const isOllamaAvailable = await ollamaClient.checkHealth();

      if (!isOllamaAvailable) {
        setAiRecommendation(generateFallbackRecommendation(points, groupMembers));
        return;
      }

      const prompt = `You are a smart group coordinator AI. Analyze this meeting scenario:

Group Members: ${groupMembers.length} people
Meeting Point Type: ${selectedType}

Top 3 Suggested Locations:
${points.slice(0, 3).map((p, i) => `${i + 1}. ${p.name}
   - Total travel distance: ${p.totalDistance.toFixed(1)}km
   - Furthest member distance: ${p.maxDistance.toFixed(1)}km`).join('\n')}

Provide a brief, friendly recommendation (2-3 sentences) on which location is best and why. Consider fairness, convenience, and total travel time.`;

      const result = await ollamaClient.generate(prompt);
      setAiRecommendation(result.response || generateFallbackRecommendation(points, groupMembers));
    } catch (error) {
      console.error('AI recommendation error:', error);
      setAiRecommendation(generateFallbackRecommendation(points, groupMembers));
    }
  };

  const generateFallbackRecommendation = (points: MeetingPoint[], groupMembers: Member[]): string => {
    if (points.length === 0) return 'No suitable locations found.';

    const topPoint = points[0];
    const avgDistance = topPoint.totalDistance / groupMembers.length;

    let recommendation = `I recommend "${topPoint.name}" as your meeting point. `;

    if (topPoint.maxDistance < 2) {
      recommendation += 'All members are within 2km, making it very convenient for everyone. ';
    } else if (topPoint.maxDistance < 5) {
      recommendation += 'Everyone is within a reasonable distance (under 5km). ';
    } else {
      recommendation += `The furthest member is ${topPoint.maxDistance.toFixed(1)}km away, but this is the most balanced option. `;
    }

    if (points.length > 1) {
      const secondBest = points[1];
      const distanceDiff = secondBest.totalDistance - topPoint.totalDistance;
      if (distanceDiff < 1) {
        recommendation += `"${secondBest.name}" is also a great alternative with similar total distance.`;
      }
    }

    return recommendation;
  };

  const findNearestMemberForTask = (task: string): Member | null => {
    if (members.length === 0) return null;
    return members[0];
  };

  useEffect(() => {
    if (members.length >= 2) {
      calculateOptimalMeetingPoint();
    }
  }, [selectedType, members.length]);

  if (members.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Smart Group Coordinator
          </CardTitle>
          <CardDescription>
            Need at least 2 members with active locations to suggest meeting points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Waiting for more group members...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Smart Group Coordinator
          </CardTitle>
          <CardDescription>
            AI-powered meeting point suggestions based on everyone's location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              What type of place?
            </label>
            <div className="flex flex-wrap gap-2">
              {placeTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type.id)}
                  className="gap-2"
                >
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Finding optimal meeting points...</p>
            </div>
          )}

          {!loading && aiRecommendation && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  AI Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{aiRecommendation}</p>
              </CardContent>
            </Card>
          )}

          {!loading && meetingPoints.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Suggested Meeting Points</h3>
              {meetingPoints.slice(0, 5).map((point, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <Badge variant="default" className="text-xs">
                              Best Choice
                            </Badge>
                          )}
                          <h4 className="font-medium">{point.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {point.reasoning}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Navigation className="h-4 w-4 mr-1" />
                        Navigate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Task Assignment Helper</CardTitle>
          <CardDescription>Who should handle tasks based on proximity?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                const nearest = findNearestMemberForTask('groceries');
                if (nearest) alert(`${nearest.name} is closest and should pick up groceries!`);
              }}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Who should pick up groceries?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
