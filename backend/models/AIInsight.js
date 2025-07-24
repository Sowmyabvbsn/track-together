import mongoose from 'mongoose';

const AIInsightSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['prediction', 'pattern', 'recommendation', 'optimization', 'alert'],
    required: true 
  },
  category: {
    type: String,
    enum: ['route', 'timing', 'communication', 'behavior', 'location'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  data: { type: mongoose.Schema.Types.Mixed },
  applied: { type: Boolean, default: false },
  feedback: {
    helpful: { type: Boolean },
    accuracy: { type: Number, min: 1, max: 5 },
    comment: { type: String }
  },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient querying
AIInsightSchema.index({ groupId: 1, userId: 1, createdAt: -1 });
AIInsightSchema.index({ type: 1, category: 1 });
AIInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.AIInsight || mongoose.model('AIInsight', AIInsightSchema);