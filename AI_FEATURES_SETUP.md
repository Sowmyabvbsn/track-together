# AI Features Setup Guide

## Overview

Your TrackTogether app now includes 6 powerful AI-driven features using **free third-party services**. All AI processing happens locally via Ollama, ensuring privacy and zero API costs.

---

## Features Implemented

### 1. Smart Group Coordinator
**Location:** `/dashboard/ai-features` → Coordinator tab

**What it does:**
- AI suggests optimal meeting points based on everyone's location
- Calculates geographic centroid of all group members
- Searches nearby places using LocationIQ
- Ranks suggestions by total travel distance
- Uses Ollama AI to provide intelligent recommendations

**Use cases:**
- "Where should we meet for lunch?"
- "Who should pick up groceries?" (suggests person closest)
- Finding coffee shops equidistant from all members

### 2. Itinerary Planner
**Location:** `/dashboard/ai-features` → Itinerary tab

**What it does:**
- Automatically extracts plans and activities from chat conversations
- Scans group chat messages for mentions of places, times, activities
- Uses Ollama AI to parse natural language
- Creates checklist of activities with locations and times
- Allows manual editing and completion tracking

**Example:**
- Chat: "Let's meet at the mall at 2pm, then grab dinner at 6"
- AI creates: ✓ Mall - 2pm, ✓ Dinner - 6pm

### 3. Context-Aware Chat Assistant
**Location:** `/dashboard/ai-features` → Chat AI tab

**What it does:**
- Analyzes group chat sentiment (detects if people are lost/frustrated)
- Generates suggested replies based on conversation context
- Uses your location to provide relevant responses
- Custom AI reply generation: "Tell them I'm running late"

**Example:**
- Detects: "Group seems confused about meeting location"
- Suggests: "I can see you're at Main St. Head north 2 blocks!"

### 4. Message Summarizer
**Location:** `/dashboard/ai-features` → Summary tab

**What it does:**
- AI summarizes missed messages with location context
- Activates when you've been offline
- Extracts key points, decisions, location updates
- Highlights unanswered questions
- Shows overall summary in 1-2 sentences

**Example:**
- Missed 20 messages while driving
- Get instant summary: "Group decided on restaurant, Sarah is running late, Mike asking about parking"

### 5. Predictive Notifications
**Location:** `/dashboard/ai-features` → Alerts tab

**What it does:**
- "John is 2 minutes away" - arrival proximity alerts
- "Group members 8km apart" - separation warnings
- "Mike hasn't updated location in 15 min" - timing concerns
- AI generates contextual suggestions for coordination

**Smart alerts include:**
- Arrival predictions based on distance
- Traffic and route suggestions
- Group separation detection
- Timing issue warnings

### 6. Voice-to-Action Commands
**Location:** `/dashboard/ai-features` → Voice tab

**What it does:**
- Uses Web Speech API (browser-native, free)
- Text-to-speech responses for hands-free operation
- Natural language processing via Ollama
- Contextual actions based on what you say

**Voice commands:**
- "Where is everyone?" → Shows map
- "Tell the group I'm running late" → AI drafts contextual message
- "Find coffee shops nearby" → Searches using your location
- "Navigate to destination" → Opens navigation

---

## Setup Instructions

### Step 1: Ollama (Local AI) - REQUIRED ✅

Ollama runs AI models locally on your machine - **completely free, no API keys needed**.

1. **Download Ollama:**
   ```bash
   # Visit: https://ollama.com/download
   # Choose your OS (Mac, Linux, Windows)
   ```

2. **Install and pull the model:**
   ```bash
   ollama pull llama2
   ```

3. **Start Ollama:**
   ```bash
   ollama serve
   ```

4. **Verify it's running:**
   ```bash
   curl http://localhost:11434/api/generate -d '{
     "model": "llama2",
     "prompt": "Hello",
     "stream": false
   }'
   ```

5. **Already configured in your .env:**
   ```
   NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434
   NEXT_PUBLIC_OLLAMA_MODEL=llama2
   ```

---

### Step 2: LocationIQ API - OPTIONAL (for place search) 📍

LocationIQ provides geocoding and place search. **Free tier: 5,000 requests/day**.

1. **Sign up:**
   - Visit: https://locationiq.com
   - Create free account
   - Go to Dashboard → Access Tokens

2. **Get your API key:**
   - Copy the access token

3. **Add to `.env.local`:**
   ```env
   NEXT_PUBLIC_LOCATIONIQ_API_KEY=your_actual_api_key_here
   ```

**Note:** Without LocationIQ, Smart Group Coordinator will still work but won't search for actual places. It will only calculate optimal meeting points based on coordinates.

---

### Step 3: Browser APIs - AUTOMATIC ✅

These features use browser-native APIs - **no setup needed**:

- **Web Speech API** - Voice recognition (Chrome, Edge, Safari)
- **Speech Synthesis API** - Text-to-speech responses
- **Geolocation API** - User's current location

**Browser Compatibility:**
- Voice Commands: Chrome, Edge, Safari (not Firefox)
- Speech Synthesis: All modern browsers
- Geolocation: All modern browsers

---

## Testing the Features

### 1. Start Ollama
```bash
ollama serve
```

### 2. Start your development server
```bash
cd frontend
npm run dev
```

### 3. Navigate to AI Features
- Go to: **http://localhost:3000/dashboard/ai-features**
- Try each tab to explore features

### 4. Test Voice Commands
- Click the microphone button
- Say: "Where is everyone?"
- Or: "Find coffee shops nearby"

---

## API Usage & Costs

| Service | Free Tier | Cost After Limit |
|---------|-----------|------------------|
| **Ollama** | Unlimited (runs locally) | $0 forever |
| **LocationIQ** | 5,000 requests/day | $0.005/request |
| **Web Speech API** | Unlimited | $0 forever |
| **Geolocation API** | Unlimited | $0 forever |

**Total monthly cost (typical usage):** **$0**

LocationIQ free tier is extremely generous:
- 5,000 requests/day = 150,000/month
- Even with 50 active users, you stay under the limit

---

## Files Created

### New Components
```
frontend/components/AI/
├── SmartGroupCoordinator.tsx      # Meeting point suggestions
├── ItineraryPlanner.tsx           # Auto-planned activities
├── ContextAwareChatAssistant.tsx  # Sentiment analysis & replies
├── MessageSummarizer.tsx          # Missed message summaries
├── PredictiveNotifications.tsx    # Smart alerts
└── VoiceActionCommands.tsx        # Voice control interface
```

### Library Files
```
frontend/lib/
└── locationiq-client.ts           # LocationIQ API integration
```

### Dashboard Page
```
frontend/app/dashboard/ai-features/
└── page.tsx                       # Unified AI features dashboard
```

---

## Feature Access

All AI features are accessible at:
```
/dashboard/ai-features
```

Each feature has its own tab:
- **Coordinator** - Meeting point suggestions
- **Itinerary** - Auto-planned activities
- **Chat AI** - Sentiment analysis & reply suggestions
- **Summary** - Missed message summaries
- **Alerts** - Predictive notifications
- **Voice** - Voice command interface

---

## Troubleshooting

### Ollama not working
```
Error: connect ECONNREFUSED ::1:11434
```
**Fix:** Start Ollama with `ollama serve`

### Voice commands not working
**Issue:** Browser doesn't support Web Speech API
**Fix:** Use Chrome, Edge, or Safari (not Firefox)

### LocationIQ errors
```
Failed to fetch places
```
**Fixes:**
1. Check API key is correct in `.env.local`
2. Verify you haven't exceeded 5,000 requests/day
3. Check API key has proper permissions

### Location not available
```
Location needed - Enable location sharing
```
**Fix:** Allow location access when browser prompts

---

## Privacy & Security

✅ **Privacy-First Design:**
- Ollama runs 100% locally - your data never leaves your machine
- LocationIQ only receives coordinates, not personal info
- Voice commands processed in browser, not sent to servers
- All chat messages stored locally

✅ **No tracking, no data collection, no external AI APIs**

---

## Recommended Model (Optional Upgrade)

For even better AI responses, try larger models:

```bash
ollama pull mistral
```

Then update `.env.local`:
```env
NEXT_PUBLIC_OLLAMA_MODEL=mistral
```

**Mistral benefits:**
- More accurate sentiment analysis
- Better itinerary extraction
- Smarter reply suggestions
- Still 100% free and local

---

## Quick Start Summary

1. **Install Ollama** → `ollama pull llama2` → `ollama serve`
2. **Get LocationIQ key** (optional) → Add to `.env.local`
3. **Start dev server** → `npm run dev`
4. **Visit** → http://localhost:3000/dashboard/ai-features
5. **Test features** → Try each tab!

---

## Resources

- **Ollama Docs:** https://github.com/ollama/ollama/blob/main/docs/api.md
- **LocationIQ Docs:** https://locationiq.com/docs
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

All features are production-ready and can be demonstrated at hackathons!
