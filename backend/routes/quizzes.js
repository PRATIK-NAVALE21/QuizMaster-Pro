const express  = require('express');
const router   = express.Router();
const Quiz     = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt  = require('../models/Attempt');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// GET /api/quizzes
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, subject, difficulty, search } = req.query;
    const query = {};
    if (req.user.role === 'student') { query.isPublished = true; query.isActive = true; }
    else { query.createdBy = req.user._id; }
    if (subject)    query.subject    = new RegExp(subject, 'i');
    if (difficulty) query.difficulty = difficulty;
    if (search)     query.$or = [{ title: new RegExp(search,'i') }, { description: new RegExp(search,'i') }, { subject: new RegExp(search,'i') }];
    const total   = await Quiz.countDocuments(query);
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email')
      .populate('questions', '_id')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: quizzes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/quizzes/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name email').populate('questions');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (req.user.role === 'student' && !quiz.isPublished)
      return res.status(403).json({ success: false, message: 'Quiz not available' });
    res.json({ success: true, data: quiz });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/quizzes
router.post('/', protect, authorize('faculty'), async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Quiz created', data: quiz });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/quizzes/:id
router.put('/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    res.json({ success: true, message: 'Quiz updated', data: quiz });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/quizzes/:id
router.delete('/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    await Question.deleteMany({ quiz: req.params.id });
    await Attempt.deleteMany({ quiz: req.params.id });
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/quizzes/:id/publish
router.patch('/:id/publish', protect, authorize('faculty'), async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, createdBy: req.user._id }).populate('questions');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (!quiz.isPublished && quiz.questions.length === 0)
      return res.status(400).json({ success: false, message: 'Add at least one question before publishing' });
    quiz.isPublished = !quiz.isPublished;
    await quiz.save();
    // Notify all students if publishing
    if (quiz.isPublished) {
      const User = require('../models/User');
      const students = await User.find({ role: 'student', isActive: true }).select('_id').limit(500);
      if (students.length > 0) {
        await Notification.insertMany(students.map(s => ({
          user: s._id,
          title: 'New Quiz Available! 📝',
          message: `"${quiz.title}" (${quiz.subject}) has been published. Go take it now!`,
          type: 'quiz_published',
          icon: '📝',
          link: `/student/quiz/${quiz._id}`
        })));
      }
    }
    res.json({ success: true, message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'}`, data: quiz });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/quizzes/:id/results  (faculty)
router.get('/:id/results', protect, authorize('faculty'), async (req, res) => {
  try {
    const attempts = await Attempt.find({ quiz: req.params.id, status: { $in: ['completed','timed_out'] } })
      .populate('student', 'name email studentId department')
      .sort({ percentage: -1, timeTaken: 1 });
    const total  = attempts.length;
    const passed = attempts.filter(a => a.isPassed).length;
    const stats  = {
      totalAttempts: total,
      passCount:     passed,
      failCount:     total - passed,
      averageScore:  total ? (attempts.reduce((s,a) => s + a.percentage, 0) / total).toFixed(2) : 0,
      highestScore:  total ? Math.max(...attempts.map(a => a.percentage)).toFixed(1) : 0,
      lowestScore:   total ? Math.min(...attempts.map(a => a.percentage)).toFixed(1) : 0,
    };
    res.json({ success: true, data: attempts, stats });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
