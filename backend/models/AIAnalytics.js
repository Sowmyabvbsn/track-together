import mongoose from 'mongoose';

const AIAnalyticsSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  date: { type: Date, required: true },
  metrics: {
    totalPredictions: { type: Number, default: 0 },
    accuratePredictions: { type: Number, default: 0 },
    routeOptimizations: { type: Number, default: 0 },
    timeSaved: { type: Number, default: 0 }, // in minutes
    notificationsGenerated: { type: Number, default: 0 },
    userInteractions: { type: Number, default: 0 },
    falsePositives: { type: Number, default: 0 },
    userSatisfactionScore: { type: Number, min: 1, max: 5 }
  },
  patterns: {
    peakUsageHours: [{ type: Number }],
    commonRoutes: [{ type: String }],
    averageGroupSize: { type: Number },
    communicationFrequency: { type: String, enum: ['low', 'medium', 'high'] },
    punctualityScore: { type: Number, min: 0, max: 1 }
  },
  insights: [{
    type: { type: String },
    description: { type: String },
    confidence: { type: Number },
    impact: { type: String, enum: ['low', 'medium', 'high'] }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for efficient date-based queries
AIAnalyticsSchema.index({ groupId: 1, date: -1 });
AIAnalyticsSchema.index({ 'metrics.userSatisfactionScore': -1 });

export default mongoose.models.AIAnalytics || mongoose.model('AIAnalytics', AIAnalyticsSchema);