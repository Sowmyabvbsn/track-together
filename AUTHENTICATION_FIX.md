# Authentication & Groups Display Fix

## 🔍 Issues Identified

### 1. Backend Not Running
The MongoDB backend needs to be running for groups to display.

### 2. Clerk Redirect Configuration
After sign-up/sign-in, Clerk needs proper redirect URLs configured.

---

## ✅ Solutions

### Step 1: Start the Backend

```bash
# Terminal 1 - Start Backend
cd backend
npm install  # If not done already
npm start

# You should see:
# Server running on port 5000
# MongoDB connected successfully
```

**Verify Backend:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"ok"}
```

---

### Step 2: Configure Clerk Redirect URLs

#### Option A: Via Clerk Dashboard (Recommended)

1. Go to: https://dashboard.clerk.com
2. Select your application
3. Navigate to: **"Paths"** (in left sidebar)
4. Configure these URLs:

```
After sign-in URL:    /dashboard
After sign-up URL:    /dashboard
Sign-in URL:          /sign-in
Sign-up URL:          /sign-up
```

5. Click **"Save"**

#### Option B: Via Environment Variables (Already Set)

Your `.env.local` already has these configured:
```bash
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**BUT**: You still need valid Clerk keys! Replace these:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

**Get Real Keys:**
1. Visit: https://dashboard.clerk.com
2. Go to: **API Keys** section
3. Copy:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)
4. Paste into `frontend/.env.local`

---

### Step 3: Verify API Connection

Your app expects backend at: `http://localhost:5000`

**Check in `frontend/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URI=http://localhost:5000
```

**Verify MongoDB Connection:**
Edit `backend/.env` and ensure:
```bash
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/tracktogether
PORT=5000
```

---

### Step 4: Restart Everything

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Ollama (optional, for AI features)
ollama serve
```

---

## 🧪 Testing the Fix

### 1. Test Backend Connection
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}

curl http://localhost:5000/groups
# Expected: [] or list of groups
```

### 2. Test Authentication Flow

1. **Open app**: http://localhost:3000
2. **Click "Sign Up"**
3. **Fill form** and submit
4. **Should redirect to**: `/dashboard` automatically
5. **Check browser console** for errors

### 3. Test Groups Display

1. **Navigate to**: http://localhost:3000/groups
2. **If no groups exist**: Should show "No active rides" message
3. **Create a group** from dashboard
4. **Groups should appear** immediately

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to fetch groups"

**Cause**: Backend not running or wrong URL

**Fix**:
```bash
# Check backend is running
ps aux | grep node

# Should see: node backend/server.js

# If not running:
cd backend && npm start
```

### Issue: "MongoDB connection failed"

**Cause**: Invalid MongoDB URI

**Fix**:
1. Check `backend/.env` has correct URI
2. Verify MongoDB Atlas cluster is active
3. Whitelist your IP in MongoDB Atlas:
   - Network Access → Add IP Address → Allow Access from Anywhere

### Issue: Still redirects to sign-in after authentication

**Cause**: Clerk keys invalid or redirect URLs not saved

**Fix**:
1. **Verify keys are real** (not placeholder)
2. **In Clerk dashboard**: Save redirect URLs
3. **Clear browser cache**: Cmd+Shift+Delete (Chrome)
4. **Restart frontend**: Ctrl+C, then `npm run dev`

### Issue: Groups page shows nothing

**Possible causes**:
1. No groups created yet (expected)
2. Backend not running
3. User not a member of any groups

**Debug**:
```bash
# Check backend logs
cd backend
npm start
# Watch for errors in terminal

# Check browser console (F12)
# Look for network errors (red text)

# Test API manually
curl http://localhost:5000/groups?clerkId=YOUR_CLERK_USER_ID
```

---

## 🔧 Complete Troubleshooting Checklist

Run through this checklist:

### Backend
- [ ] MongoDB Atlas cluster is active
- [ ] IP whitelisted in MongoDB Atlas
- [ ] `backend/.env` has valid `MONGODB_URI`
- [ ] Backend running: `npm start`
- [ ] Health check passes: `curl http://localhost:5000/health`

### Frontend
- [ ] `frontend/.env.local` has real Clerk keys (not placeholders)
- [ ] Frontend running: `npm run dev`
- [ ] Can access: http://localhost:3000

### Clerk
- [ ] Account created at https://dashboard.clerk.com
- [ ] Application created
- [ ] API keys copied to `.env.local`
- [ ] Redirect URLs configured in Clerk dashboard

### Authentication
- [ ] Can access sign-up page: http://localhost:3000/sign-up
- [ ] Can submit sign-up form
- [ ] Redirects to `/dashboard` after sign-up
- [ ] Can see user name in navbar

### Groups
- [ ] Can access groups page: http://localhost:3000/groups
- [ ] If no groups: Shows "No active rides"
- [ ] Can create group from dashboard
- [ ] New group appears in groups list

---

## 🚀 Quick Fix Script

Run this to verify everything:

```bash
#!/bin/bash
echo "=== TrackTogether Health Check ==="

# Check backend
echo -e "\n1. Checking backend..."
if curl -s http://localhost:5000/health > /dev/null; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is NOT running"
  echo "   Run: cd backend && npm start"
fi

# Check frontend
echo -e "\n2. Checking frontend..."
if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Frontend is running"
else
  echo "❌ Frontend is NOT running"
  echo "   Run: cd frontend && npm run dev"
fi

# Check environment files
echo -e "\n3. Checking environment files..."
if grep -q "your_clerk_publishable_key_here" frontend/.env.local; then
  echo "⚠️  Clerk keys are placeholders"
  echo "   Get real keys from: https://dashboard.clerk.com"
else
  echo "✅ Clerk keys configured"
fi

echo -e "\n=== Done ==="
```

Save as `health-check.sh`, make executable, and run:
```bash
chmod +x health-check.sh
./health-check.sh
```

---

## 📝 Expected Behavior After Fix

### After Sign-Up:
1. User fills sign-up form
2. Clerk creates account
3. **Automatic redirect** to `/dashboard`
4. User sees dashboard with their name in navbar
5. Can navigate to Groups tab

### Groups Page:
1. If backend running + no groups: "No active rides" message
2. If backend running + has groups: List of groups displayed
3. If backend NOT running: Loading spinner indefinitely or error

---

## 🎯 Summary

**Root Causes:**
1. Backend not started → Groups can't be fetched
2. Clerk keys are placeholders → Authentication fails
3. Redirect URLs not saved in Clerk → Manual navigation needed

**Fixes:**
1. Start backend: `cd backend && npm start`
2. Get real Clerk keys from dashboard
3. Configure redirect URLs in Clerk dashboard
4. Restart frontend

**After fixes, authentication should work seamlessly!**

---

## 💡 Pro Tips

1. **Keep backend running** in a dedicated terminal
2. **Watch backend logs** for errors
3. **Check browser console** (F12) for frontend errors
4. **Test with curl** before blaming frontend
5. **Clear browser cache** after changing env vars

---

## 📞 Still Having Issues?

If groups still don't show:

1. **Check browser console** (F12 → Console tab)
2. **Check network tab** (F12 → Network tab)
3. **Look for red errors** (failed API calls)
4. **Check backend terminal** for error logs
5. **Verify MongoDB Atlas** cluster is not paused

**Common Error Messages:**

- `net::ERR_CONNECTION_REFUSED` → Backend not running
- `401 Unauthorized` → Clerk keys invalid
- `CORS error` → Backend CORS misconfigured
- `No groups found` → Normal if none created yet

---

**Good luck! Your app will work great once backend is running and Clerk keys are configured.** 🚀
