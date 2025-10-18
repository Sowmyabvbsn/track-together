import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, groupContext, conversationHistory } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const lowerMessage = message.toLowerCase();
    const replies = [];
    
    // Generate contextual replies based on message content
    if (lowerMessage.includes('where') || lowerMessage.includes('location')) {
      replies.push(
        { text: '📍 I\'m at the coffee shop on 5th Street', type: 'detailed', confidence: 0.9, tone: 'helpful' },
        { text: 'Still on my way, about 10 minutes out', type: 'quick', confidence: 0.8, tone: 'casual' },
        { text: 'Let me share my live location', type: 'action', confidence: 0.9, tone: 'helpful' }
      );
    } else if (lowerMessage.includes('eta') || lowerMessage.includes('when')) {
      replies.push(
        { text: '🕐 ETA: 15 minutes', type: 'quick', confidence: 0.9, tone: 'casual' },
        { text: 'Should be there by 3:30 PM', type: 'detailed', confidence: 0.8, tone: 'formal' },
        { text: 'Almost there! Just a few more minutes', type: 'quick', confidence: 0.8, tone: 'casual' }
      );
    } else if (lowerMessage.includes('late') || lowerMessage.includes('delay')) {
      replies.push(
        { text: 'No worries, take your time! Safety first 🚗', type: 'supportive', confidence: 0.9, tone: 'casual' },
        { text: 'Thanks for the heads up', type: 'quick', confidence: 0.8, tone: 'casual' },
        { text: 'We\'ll wait for you. Drive safely!', type: 'detailed', confidence: 0.8, tone: 'supportive' }
      );
    } else if (lowerMessage.includes('arrived') || lowerMessage.includes('here')) {
      replies.push(
        { text: 'Awesome! See you in a minute 👋', type: 'quick', confidence: 0.9, tone: 'excited' },
        { text: 'Great! We\'re just parking now', type: 'detailed', confidence: 0.8, tone: 'casual' },
        { text: 'Perfect timing! 🎯', type: 'quick', confidence: 0.8, tone: 'casual' }
      );
    } else if (lowerMessage.includes('help') || lowerMessage.includes('emergency')) {
      replies.push(
        { text: '🚨 On my way to help! What do you need?', type: 'urgent', confidence: 0.95, tone: 'urgent' },
        { text: 'Calling you now!', type: 'action', confidence: 0.9, tone: 'urgent' },
        { text: 'Stay safe! Help is coming', type: 'supportive', confidence: 0.9, tone: 'urgent' }
      );
    } else {
      // Generic helpful replies
      replies.push(
        { text: 'Thanks for the update! 👍', type: 'quick', confidence: 0.8, tone: 'casual' },
        { text: 'Got it! See you soon', type: 'quick', confidence: 0.8, tone: 'casual' },
        { text: 'Sounds good to me', type: 'quick', confidence: 0.7, tone: 'casual' }
      );
    }
    
    // Generate suggested actions
    const suggestedActions = [];
    
    if (lowerMessage.includes('where') || lowerMessage.includes('location')) {
      suggestedActions.push({
        action: 'share_location',
        description: 'Share your current location',
        priority: 'medium'
      });
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('emergency')) {
      suggestedActions.push({
        action: 'emergency',
        description: 'Trigger emergency protocol',
        priority: 'high'
      });
    }
    
    return NextResponse.json({
      replies: replies.slice(0, 3), // Return top 3 replies
      suggestedActions,
      context: {
        messageAnalyzed: message,
        groupSize: groupContext?.memberCount || 0,
        conversationLength: conversationHistory?.length || 0
      },
      provider: 'api',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Smart replies API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate smart replies' },
      { status: 500 }
    );
  }
}
