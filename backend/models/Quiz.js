const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, default: '' },
  subject: { type: String, required: true, trim: true },
  category: { type: String, trim: true, default: 'General' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  duration: { type: Number, default: 30, min: 1 },
  totalMarks: { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date },
  endDate: { type: Date },
  maxAttempts: { type: Number, default: 1 },
  shuffleQuestions: { type: Boolean, default: false },
  shuffleOptions: { type: Boolean, default: false },
  showResults: { type: Boolean, default: true },
  showAnswersAfter: { type: Boolean, default: true },
  instructions: { type: String, default: '' },
  tags: [String],
  attemptCount: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  // Access control
  accessCode: { type: String, default: '' }, // optional passcode to join
  allowedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // empty = all
  // Anti-cheat
  antiCheat: {
    preventTabSwitch: { type: Boolean, default: true },
    preventCopyPaste: { type: Boolean, default: true },
    preventRightClick: { type: Boolean, default: true },
    fullscreenRequired: { type: Boolean, default: false },
    maxWarnings: { type: Number, default: 3 },
    randomizeQuestions: { type: Boolean, default: false }
  },
  // Certificate
  certificateEnabled: { type: Boolean, default: false },
  certificateMinScore: { type: Number, default: 80 },
  // Leaderboard
  leaderboardEnabled: { type: Boolean, default: true },
  // Feedback
  feedbackEnabled: { type: Boolean, default: true },
  // Cover image
  coverImage: { type: String, default: '' },
  // Points per quiz
  pointsOnPass: { type: Number, default: 10 }
}, { timestamps: true });

quizSchema.index({ createdBy: 1, isPublished: 1 });
quizSchema.index({ subject: 1, difficulty: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
