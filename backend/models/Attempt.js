const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false }
  }],
  totalMarks: { type: Number, default: 0 },
  obtainedMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  isPassed: { type: Boolean, default: false },
  status: { type: String, enum: ['in_progress', 'completed', 'timed_out', 'abandoned', 'disqualified'], default: 'in_progress' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  timeTaken: { type: Number, default: 0 },
  attemptNumber: { type: Number, default: 1 },
  questionsOrder: [mongoose.Schema.Types.ObjectId],
  // Anti-cheat tracking
  antiCheatLog: [{
    event: String, // tab_switch, copy_attempt, fullscreen_exit, right_click
    timestamp: { type: Date, default: Date.now },
    details: String
  }],
  warningCount: { type: Number, default: 0 },
  isDisqualified: { type: Boolean, default: false },
  disqualificationReason: { type: String, default: '' },
  // Browser/device info
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  // Proctoring
  focusLostCount: { type: Number, default: 0 },
  // Points earned
  pointsEarned: { type: Number, default: 0 },
  // Rank (filled after submission)
  rank: { type: Number, default: 0 },
  // Student feedback on quiz
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: '' },
    submittedAt: { type: Date }
  },
  // Certificate issued
  certificateIssued: { type: Boolean, default: false },
  certificateId: { type: String, default: '' }
}, { timestamps: true });

attemptSchema.index({ quiz: 1, student: 1 });
attemptSchema.index({ student: 1, createdAt: -1 });
attemptSchema.index({ quiz: 1, percentage: -1 });

module.exports = mongoose.model('Attempt', attemptSchema);
