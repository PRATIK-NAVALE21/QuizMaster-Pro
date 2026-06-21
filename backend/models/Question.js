const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  text: { type: String, required: true, trim: true },
  type: { type: String, enum: ['mcq', 'true_false', 'multi_select'], default: 'mcq' },
  options: [{ text: { type: String, required: true, trim: true }, isCorrect: { type: Boolean, default: false } }],
  explanation: { type: String, trim: true, default: '' },
  hint: { type: String, trim: true, default: '' },
  marks: { type: Number, default: 1, min: 0 },
  negativeMark: { type: Number, default: 0, min: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isAIGenerated: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  // Analytics
  timesAnswered: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 }
}, { timestamps: true });

questionSchema.virtual('accuracy').get(function() {
  return this.timesAnswered > 0 ? ((this.timesCorrect / this.timesAnswered) * 100).toFixed(1) : 0;
});
questionSchema.index({ quiz: 1, order: 1 });
module.exports = mongoose.model('Question', questionSchema);
