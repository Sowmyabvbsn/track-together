# RiderConnect Backend

## Environment Setup

### Required Environment Variables

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure required variables:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `ALLOWED_ORIGINS`: Frontend domain(s) for CORS
   - `JWT_SECRET`: Secure random string (32+ characters)

3. **Optional AI Features:**
   - `OPENAI_API_KEY`: For AI-powered features
   - `GEMINI_API_KEY`: For Google AI features
   - `HUGGING_FACE_API_KEY`: For ML models

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see above)

3. Start the development server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Groups
- `POST /groups/create` - Create a new group
- `POST /groups/join` - Join a group with invite code
- `GET /groups/active` - Get active groups for user
- `GET /groups/archive` - Get archived groups for user
- `DELETE /groups/:id` - Delete a group

### Notifications
- `GET /notifications` - Get user notifications
- `PATCH /notifications/mark-all` - Mark all as read

### AI Features
- `POST /ai/insights/generate` - Generate AI insights
- `GET /ai/insights/:groupId` - Get AI insights for group
- `POST /ai/optimize/route` - AI route optimization
- `POST /ai/analyze/message` - AI message analysis

## Environment Variables Reference

See `.env.example` for a complete list of available environment variables and their descriptions.