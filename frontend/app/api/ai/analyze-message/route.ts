import { NextRequest, NextResponse } from 'next/server';
import { MessageProcessor } from '@/lib/ai-services';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const analysis = await MessageProcessor.analyzeMessage(message, context);
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Message analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    );
  }
}
