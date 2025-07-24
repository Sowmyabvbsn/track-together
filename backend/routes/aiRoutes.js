import express from 'express';
import AIInsight from '../models/AIInsight.js';
import AIAnalytics from '../models/AIAnalytics.js';
import Group from '../models/Group.js';
import UserLocation from '../models/UserLocation.js';
import Message from '../models/Message.js';

const router = express.Router();

// Generate AI insights for a group
router.post('/insights/generate', async (req, res) => {
  const { groupId, userId } = req.body;
  
  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.members.some(m => m.clerkId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Generate AI insights
    const insights = await generateGroupInsights(groupId, userId);
    
    // Save insights to database
    const savedInsights = await Promise.all(
      insights.map(insight => new AIInsight(insight).save())
    );

    res.json({ insights: savedInsights });
  } catch (error) {
    console.error('AI insights generation error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Get AI insights for a group
router.get('/insights/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.query;

  try {
    const insights = await AIInsight.find({
      groupId,
      userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Apply an AI insight
router.patch('/insights/:insightId/apply', async (req, res) => {
  const { insightId } = req.params;
  const { userId } = req.body;

  try {
    const insight = await AIInsight.findById(insightId);
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    if (insight.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    insight.applied = true;
    insight.updatedAt = new Date();
    await insight.save();

    // Update analytics
    await updateAIAnalytics(insight.groupId, 'insight_applied');

    res.json({ success: true, insight });
  } catch (error) {
    console.error('Apply insight error:', error);
    res.status(500).json({ error: 'Failed to apply insight' });
  }
});

// Provide feedback on AI insight
router.patch('/insights/:insightId/feedback', async (req, res) => {
  const { insightId } = req.params;
  const { userId, helpful, accuracy, comment } = req.body;

  try {
    const insight = await AIInsight.findById(insightId);
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    if (insight.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    insight.feedback = { helpful, accuracy, comment };
    insight.updatedAt = new Date();
    await insight.save();

    // Update analytics based on feedback
    await updateAIAnalytics(insight.groupId, 'feedback_received', { accuracy, helpful });

    res.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// Get AI analytics for a group
router.get('/analytics/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { days = 30 } = req.query;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await AIAnalytics.find({
      groupId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    // Calculate aggregated metrics
    const aggregated = calculateAggregatedMetrics(analytics);

    res.json({ analytics, aggregated });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// AI-powered route optimization
router.post('/optimize/route', async (req, res) => {
  const { groupId, userId, waypoints } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group || !group.members.some(m => m.clerkId === userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Simulate AI route optimization
    const optimizedRoute = await optimizeRouteWithAI(waypoints, group);
    
    // Save optimization insight
    const insight = new AIInsight({
      groupId,
      userId,
      type: 'optimization',
      category: 'route',
      title: 'Route Optimization Available',
      description: `AI found a route that saves ${optimizedRoute.timeSaved} minutes`,
      confidence: optimizedRoute.confidence,
      priority: 'medium',
      data: optimizedRoute,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    await insight.save();

    res.json({ optimizedRoute, insight });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ error: 'Failed to optimize route' });
  }
});

// AI-powered message analysis
router.post('/analyze/message', async (req, res) => {
  const { groupId, userId, message } = req.body;

  try {
    const analysis = await analyzeMessageWithAI(message, groupId);
    res.json({ analysis });
  } catch (error) {
    console.error('Message analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze message' });
  }
});

// Helper functions
async function generateGroupInsights(groupId, userId) {
  const insights = [];
  
  try {
    // Get group data
    const group = await Group.findById(groupId);
    const messages = await Message.find({ groupId }).sort({ timestamp: -1 }).limit(50);
    const locations = await UserLocation.find({ groupId });

    // Pattern analysis
    const patterns = analyzeGroupPatterns(group, messages, locations);
    
    // Generate timing insights
    if (patterns.delayPattern) {
      insights.push({
        groupId,
        userId,
        type: 'pattern',
        category: 'timing',
        title: 'Delay Pattern Detected',
        description: `Group typically runs ${patterns.delayPattern.average} minutes late`,
        confidence: 0.85,
        priority: 'medium',
        data: patterns.delayPattern,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }

    // Generate communication insights
    if (patterns.communicationFrequency === 'high') {
      insights.push({
        groupId,
        userId,
        type: 'recommendation',
        category: 'communication',
        title: 'High Communication Activity',
        description: 'Consider enabling smart notification filtering',
        confidence: 0.9,
        priority: 'low',
        data: { frequency: patterns.communicationFrequency },
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      });
    }

    // Generate location insights
    if (patterns.groupCohesion < 0.5) {
      insights.push({
        groupId,
        userId,
        type: 'alert',
        category: 'location',
        title: 'Group Spread Alert',
        description: 'Group members are widely dispersed',
        confidence: 0.95,
        priority: 'high',
        data: { cohesion: patterns.groupCohesion },
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
      });
    }

  } catch (error) {
    console.error('Insight generation error:', error);
  }

  return insights;
}

function analyzeGroupPatterns(group, messages, locations) {
  // Simulate pattern analysis
  return {
    delayPattern: {
      average: Math.floor(Math.random() * 20) + 5,
      frequency: 0.7
    },
    communicationFrequency: messages.length > 30 ? 'high' : messages.length > 10 ? 'medium' : 'low',
    groupCohesion: Math.random(),
    meetingTimes: ['9:00 AM', '2:00 PM', '6:00 PM']
  };
}

async function optimizeRouteWithAI(waypoints, group) {
  // Simulate AI route optimization
  return {
    optimizedWaypoints: waypoints,
    timeSaved: Math.floor(Math.random() * 15) + 5,
    distanceSaved: Math.floor(Math.random() * 5) + 1,
    confidence: 0.85 + Math.random() * 0.1,
    factors: ['traffic', 'road_conditions', 'historical_data']
  };
}

async function analyzeMessageWithAI(message, groupId) {
  // Simulate AI message analysis
  const sentiments = ['positive', 'neutral', 'negative', 'urgent'];
  const intents = ['location_request', 'eta_query', 'emergency', 'casual', 'arrival_notification'];
  
  return {
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
    intent: intents[Math.floor(Math.random() * intents.length)],
    urgency: Math.random(),
    suggestions: [
      'I\'m running 10 minutes late',
      'Traffic is heavy on my route',
      'I\'ve arrived at the destination'
    ],
    autoResponses: message.toLowerCase().includes('where') ? ['📍 Share location'] : []
  };
}

async function updateAIAnalytics(groupId, eventType, data = {}) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await AIAnalytics.findOne({ groupId, date: today });
    
    if (!analytics) {
      analytics = new AIAnalytics({
        groupId,
        date: today,
        metrics: {},
        patterns: {},
        insights: []
      });
    }

    // Update metrics based on event type
    switch (eventType) {
      case 'insight_applied':
        analytics.metrics.userInteractions += 1;
        break;
      case 'feedback_received':
        if (data.helpful) {
          analytics.metrics.accuratePredictions += 1;
        } else {
          analytics.metrics.falsePositives += 1;
        }
        if (data.accuracy) {
          analytics.metrics.userSatisfactionScore = 
            (analytics.metrics.userSatisfactionScore + data.accuracy) / 2;
        }
        break;
      case 'route_optimized':
        analytics.metrics.routeOptimizations += 1;
        analytics.metrics.timeSaved += data.timeSaved || 0;
        break;
      case 'notification_generated':
        analytics.metrics.notificationsGenerated += 1;
        break;
    }

    analytics.updatedAt = new Date();
    await analytics.save();
  } catch (error) {
    console.error('Analytics update error:', error);
  }
}

function calculateAggregatedMetrics(analytics) {
  if (analytics.length === 0) return {};

  const totals = analytics.reduce((acc, day) => {
    acc.totalPredictions += day.metrics.totalPredictions || 0;
    acc.accuratePredictions += day.metrics.accuratePredictions || 0;
    acc.routeOptimizations += day.metrics.routeOptimizations || 0;
    acc.timeSaved += day.metrics.timeSaved || 0;
    acc.notificationsGenerated += day.metrics.notificationsGenerated || 0;
    acc.userInteractions += day.metrics.userInteractions || 0;
    acc.falsePositives += day.metrics.falsePositives || 0;
    return acc;
  }, {
    totalPredictions: 0,
    accuratePredictions: 0,
    routeOptimizations: 0,
    timeSaved: 0,
    notificationsGenerated: 0,
    userInteractions: 0,
    falsePositives: 0
  });

  return {
    ...totals,
    accuracyRate: totals.totalPredictions > 0 ? 
      (totals.accuratePredictions / totals.totalPredictions) * 100 : 0,
    avgSatisfactionScore: analytics.reduce((sum, day) => 
      sum + (day.metrics.userSatisfactionScore || 0), 0) / analytics.length
  };
}

export default router;