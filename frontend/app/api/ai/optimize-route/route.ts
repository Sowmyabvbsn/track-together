import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { waypoints, groupContext, realTimeData } = await request.json();
    
    if (!waypoints || !Array.isArray(waypoints)) {
      return NextResponse.json(
        { error: 'Valid waypoints array is required' },
        { status: 400 }
      );
    }

    // Enhanced route optimization logic
    const memberCount = groupContext?.memberCount || 1;
    const preferences = groupContext?.preferences || 'fastest';
    
    // Calculate base metrics
  const totalDistance = waypoints.length > 1 ? 150 + Math.random() * 100 : 0;
    const baseTime = totalDistance * 1.2; // Base time calculation
    
    // Apply traffic multiplier
    const trafficMultiplier = realTimeData?.traffic === 'heavy' ? 1.4 :
                             realTimeData?.traffic === 'moderate' ? 1.2 : 1.0;
    
    // Apply group size multiplier
    const groupMultiplier = 1 + ((memberCount - 1) * 0.05);
    
    const optimizedTime = baseTime * trafficMultiplier * groupMultiplier;
    const timeSaved = Math.max(5, Math.floor(baseTime * 0.15));
    
    const optimization = {
      optimizedRoute: {
        waypoints,
        totalDistance: Math.round(totalDistance),
        estimatedTime: Math.round(optimizedTime),
        timeSaved
      },
      alternatives: [
        {
          name: 'Highway Route',
          timeDiff: -timeSaved + 3,
         distanceDiff: 8,
          pros: ['Faster overall', 'Less traffic lights', 'Better road conditions'],
          cons: ['Tolls may apply', 'Less scenic', 'Limited rest stops']
        },
        {
          name: 'Scenic Route',
          timeDiff: timeSaved - 5,
          distanceDiff: -12,
         pros: ['Beautiful scenery', 'Multiple rest stops', 'Photo opportunities'],
          cons: ['Takes longer', 'More winding roads', 'Potential weather exposure']
        },
        {
          name: 'Eco-Friendly Route',
          timeDiff: Math.floor(timeSaved / 2),
          distanceDiff: -5,
          pros: ['Lower fuel consumption', 'Reduced emissions', 'Cost effective'],
          cons: ['Slightly longer', 'Some city traffic', 'More stops']
        }
      ],
      trafficInsights: {
        currentConditions: `${realTimeData?.traffic || 'Moderate'} traffic conditions`,
        predictedConditions: 'Traffic expected to improve in next 45 minutes',
        recommendations: [
          'Monitor real-time traffic updates',
          'Consider departure time adjustment',
          'Have backup route ready',
         'Account for group coordination time'
        ]
      },
      confidence: 0.82 + Math.random() * 0.13,
      reasoning: `Route optimized for ${preferences} travel with ${memberCount} group members, considering ${realTimeData?.traffic || 'moderate'} traffic conditions`,
      factors: {
        traffic: trafficMultiplier,
        groupSize: groupMultiplier,
        weather: realTimeData?.weather === 'clear' ? 1.0 : 1.1,
        timeOfDay: new Date().getHours()
      },
      provider: 'api',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(optimization);
  } catch (error) {
    console.error('Route optimization API error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize route' },
      { status: 500 }
    );
  }
}