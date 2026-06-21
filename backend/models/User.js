const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  avatar: { type: String, default: '' },
  department: { type: String, trim: true, default: '' },
  studentId: { type: String, trim: true, default: '' },
  bio: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  lastLogin: { type: Date },
  loginCount: { type: Number, default: 0 },
  // Anti-cheat fields
  suspiciousActivityCount: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  // Gamification
  totalPoints: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastAttemptDate: { type: Date },
  badges: [{ type: String }],
  // Notifications
  notifications: [{
    message: String,
    type: { type: String, enum: ['info', 'success', 'warning', 'quiz'] },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    theme: { type: String, default: 'light' }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.comparePassword = async function(p) { return bcrypt.compare(p, this.password); };
userSchema.methods.toJSON = function() { const o = this.toObject(); delete o.password; return o; };

module.exports = mongoose.model('User', userSchema);
