# Quick Start - AI Features

## 🚀 Get Started in 3 Steps

### 1. Install Ollama
```bash
# Download from https://ollama.com
# Then run:
ollama pull llama2
ollama serve
```

### 2. Start the App
```bash
cd frontend
npm run dev
```

### 3. Access Features
Visit: **http://localhost:3000/dashboard/ai-features**

Or click **"AI Features"** in the navbar!

---

## 🎯 What You Get

| Feature | What it Does | Try This |
|---------|-------------|----------|
| **Smart Coordinator** | Suggests meeting spots | Add 2+ members to a group |
| **Itinerary Planner** | Extracts plans from chat | Message: "Meet at mall 2pm" |
| **Chat Assistant** | Analyzes sentiment | Have a conversation |
| **Message Summarizer** | Summarizes missed chats | Leave for 20 min |
| **Predictive Alerts** | Smart notifications | Enable location tracking |
| **Voice Commands** | Hands-free control | Say "Where is everyone?" |

---

## 🆓 All Free Services

- **Ollama** - Local AI (unlimited, $0)
- **LocationIQ** - 5,000 requests/day free
- **Web Speech API** - Browser-native (unlimited, $0)

---

## 📖 Full Documentation

See `AI_FEATURES_SETUP.md` for complete setup instructions and troubleshooting.

## ✅ Files Created

- 6 AI components in `/frontend/components/AI/`
- 1 library file: `/frontend/lib/locationiq-client.ts`
- 1 dashboard page: `/frontend/app/dashboard/ai-features/page.tsx`
- Navigation link added to navbar

## 🔧 Optional: LocationIQ Setup

For place search (optional):

1. Sign up at https://locationiq.com
2. Get API key from Dashboard
3. Add to `/frontend/.env.local`:
   ```
   NEXT_PUBLIC_LOCATIONIQ_API_KEY=your_key_here
   ```

---

**Need help?** Check `AI_FEATURES_SETUP.md` or `AI_FEATURES_SUMMARY.txt`
