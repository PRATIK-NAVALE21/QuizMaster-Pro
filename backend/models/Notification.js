const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['quiz_published', 'result_ready', 'badge_earned', 'system', 'reminder'], default: 'system' },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: '' },
  icon: { type: String, default: '🔔' }
}, { timestamps: true });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', notificationSchema);
