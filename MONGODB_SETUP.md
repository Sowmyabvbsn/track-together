# MongoDB Setup - TrackTogether Backend

## Overview

TrackTogether uses **MongoDB exclusively** for all data persistence. No Supabase or other databases are needed.

---

## Database Configuration

### Your MongoDB Connection

The backend is already configured with your MongoDB Atlas cluster:

```
mongodb+srv://Sowmyabvbsn:X9GNqxsnxL48Ksmx@cluster0.9hbmuj5.mongodb.net/
```

This connection string is stored in:
- `/backend/.env` → `MONGODB_URI`

---

## Environment Variables

### Backend `.env` File

Location: `/backend/.env`

```env
MONGODB_URI=mongodb+srv://Sowmyabvbsn:X9GNqxsnxL48Ksmx@cluster0.9hbmuj5.mongodb.net/
PORT=5000
NODE_ENV=development
```

**Note:** The `.env` file is already created and gitignored for security.

---

## MongoDB Collections

Your backend uses these MongoDB models:

### 1. Groups
**File:** `/backend/models/Group.js`

Stores group information:
- Group name, code (join code)
- Source and destination
- Start time and reach time
- Members array (clerkId, name, avatar)
- Created by (clerkId)
- Distance threshold

### 2. Messages
**File:** `/backend/models/Message.js`

Stores group chat messages:
- Group ID
- Sender ID and name
- Message content
- Timestamp

### 3. User Locations
**File:** `/backend/models/UserLocation.js`

Real-time location tracking:
- User ID (clerkId)
- Group ID
- Latitude and longitude
- Timestamp

### 4. Notifications
**File:** `/backend/models/Notification.js`

User notifications:
- User ID (clerkId)
- Type, title, message
- Read status
- Timestamp

### 5. Safety Alerts
**File:** `/backend/models/SafetyAlert.js`

Emergency and safety alerts:
- Group ID
- User ID
- Alert type and severity
- Location coordinates
- Status (active/resolved)

### 6. AI Analytics
**File:** `/backend/models/AIAnalytics.js`

AI feature usage analytics:
- Group ID
- Feature type
- Metrics and insights
- Timestamp

### 7. AI Insights
**File:** `/backend/models/AIInsight.js`

AI-generated insights:
- Group ID
- Insight type
- Content and suggestions
- Confidence score

---

## Database Connection

### Connection Logic

File: `/backend/config/db.js`

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');

    // Create indexes for performance
    await Group.createIndexes();
    await UserLocation.createIndexes();
    await Notification.createIndexes();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
```

---

## Starting the Backend

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Verify .env File
Ensure `/backend/.env` exists with your MongoDB URI:
```bash
cat backend/.env
```

### 3. Start Server
```bash
npm start
```

Expected output:
```
MongoDB connected successfully
Database: test
Database indexes created
Server running on port 5000
```

---

## Testing MongoDB Connection

### Quick Test Script

Create `/backend/test-mongodb.js`:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections: ${collections.map(c => c.name).join(', ')}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

testConnection();
```

Run it:
```bash
node test-mongodb.js
```

---

## MongoDB Atlas Dashboard

Access your database:
1. Visit: https://cloud.mongodb.com
2. Login with your credentials
3. Select **Cluster0**
4. Click **Browse Collections**

You can:
- View all documents
- Create indexes
- Monitor performance
- Export data

---

## Security Best Practices

### ✅ Current Setup (Secure)
- MongoDB URI stored in `.env` file
- `.env` is gitignored (won't be committed)
- Connection uses SSL/TLS encryption
- MongoDB Atlas has IP whitelist

### 🔒 Additional Security

**For production, consider:**
1. **Restrict IP Access**
   - MongoDB Atlas → Network Access
   - Add specific IP addresses only

2. **Use Database Users**
   - Create separate read/write users
   - Limit permissions per user

3. **Enable MongoDB Atlas Monitoring**
   - Set up alerts for unusual activity
   - Monitor connection spikes

4. **Rotate Credentials**
   - Change passwords periodically
   - Update `.env` when credentials change

---

## Common Issues & Fixes

### Connection Timeout
```
Error: connect ETIMEDOUT
```
**Fix:** Check MongoDB Atlas Network Access whitelist

### Authentication Failed
```
Error: Authentication failed
```
**Fix:** Verify MONGODB_URI in `.env` is correct

### Database Not Found
```
Error: Database does not exist
```
**Fix:** MongoDB creates databases automatically on first write

### Indexes Not Created
```
Warning: Index already exists
```
**Fix:** Normal - indexes are persistent, only created once

---

## Data Persistence

### AI Features Integration

The AI features work independently but can save to MongoDB:

**Example: Save AI Insight**
```javascript
import AIInsight from './models/AIInsight.js';

// Save an AI-generated insight
const insight = new AIInsight({
  groupId: 'group123',
  type: 'meeting_suggestion',
  content: 'Optimal meeting point: Central Park',
  confidence: 0.95
});

await insight.save();
```

**Example: Save AI Analytics**
```javascript
import AIAnalytics from './models/AIAnalytics.js';

// Track AI feature usage
const analytics = new AIAnalytics({
  groupId: 'group123',
  feature: 'smart_coordinator',
  metrics: { suggestions: 5, accepted: 3 }
});

await analytics.save();
```

---

## Backup & Recovery

### Manual Backup (MongoDB Atlas)
1. Go to MongoDB Atlas Dashboard
2. Select Cluster → Backup tab
3. Create on-demand snapshot
4. Download backup if needed

### Automated Backups
MongoDB Atlas provides:
- Continuous backups (every 6 hours)
- Point-in-time recovery
- 7-day retention (free tier)

---

## Migration from Supabase

If you previously used Supabase:

### ✅ Already Removed
- Supabase keys removed from `.env`
- No Supabase imports in codebase
- All data models use MongoDB/Mongoose

### ✅ No Migration Needed
Your backend was already using MongoDB exclusively!

---

## Summary

✅ **MongoDB Connection:** Configured and ready
✅ **Environment Variables:** Set in `/backend/.env`
✅ **Models:** 7 Mongoose models for all features
✅ **Security:** Connection string is gitignored
✅ **AI Integration:** Ready for persistence
✅ **No Supabase:** Completely removed

**Your backend uses MongoDB only** - no other databases required!

---

## Quick Reference

| What | Where |
|------|-------|
| **MongoDB URI** | `backend/.env` |
| **Connection Logic** | `backend/config/db.js` |
| **Models** | `backend/models/*.js` |
| **Server** | `backend/server.js` |
| **Start Command** | `cd backend && npm start` |

---

## Support Resources

- **MongoDB Docs:** https://docs.mongodb.com
- **Mongoose Docs:** https://mongoosejs.com/docs
- **MongoDB Atlas:** https://cloud.mongodb.com
