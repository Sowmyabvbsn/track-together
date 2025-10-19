import mongoose from 'mongoose';

const safetyAlertSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: [
      'route_deviation',
      'unusual_speed',
      'extended_stop',
      'dangerous_area',
      'group_separation',
      'late_arrival',
      'no_movement',
      'battery_low',
      'emergency'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  aiAnalysis: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    reasoning: String,
    recommendations: [String],
    predictedOutcome: String
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: [{
    userId: String,
    timestamp: Date
  }],
  resolvedBy: {
    userId: String,
    timestamp: Date,
    resolution: String
  },
  metadata: {
    speed: Number,
    expectedRoute: mongoose.Schema.Types.Mixed,
    actualRoute: mongoose.Schema.Types.Mixed,
    groupContext: mongoose.Schema.Types.Mixed
  },
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

safetyAlertSchema.index({ createdAt: -1 });
safetyAlertSchema.index({ status: 1, severity: 1 });
safetyAlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('SafetyAlert', safetyAlertSchema);
