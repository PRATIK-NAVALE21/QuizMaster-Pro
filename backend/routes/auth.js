const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'faculty']).withMessage('Role must be student or faculty'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, email, password, role, department, studentId } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role, department: department || '', studentId: studentId || '' });
    // Welcome notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to QuizMaster Pro! 🎉',
      message: `Hi ${name}, your ${role} account is ready. ${role === 'student' ? 'Browse quizzes and start learning!' : 'Create your first quiz now!'}`,
      type: 'system', icon: '👋'
    });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Registration successful', token, user });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!user.isActive)
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    if (user.isBanned)
      return res.status(401).json({ success: false, message: `Account banned: ${user.banReason}` });
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful', token, user: user.toJSON() });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/auth/profile
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, department, studentId, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name }), ...(department !== undefined && { department }), ...(studentId !== undefined && { studentId }), ...(bio !== undefined && { bio }) },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated', user });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
