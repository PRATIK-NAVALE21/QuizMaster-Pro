const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Global leaderboard - top students by total points
router.get('/global', protect, async (req, res) => {
  try {
    const top = await User.find({ role: 'student', isActive: true })
      .select('name department totalPoints level badges streak studentId')
      .sort({ totalPoints: -1 })
      .limit(50);
    const myRank = top.findIndex(u => u._id.toString() === req.user._id.toString()) + 1;
    res.json({ success: true, data: top, myRank });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Per-quiz leaderboard
router.get('/quiz/:quizId', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ quiz: req.params.quizId, status: 'completed' })
      .populate('student', 'name department studentId')
      .sort({ percentage: -1, timeTaken: 1 })
      .limit(100);

    const ranked = attempts.map((a, i) => ({ ...a.toObject(), rank: i + 1 }));
    const myEntry = ranked.find(r => r.student?._id?.toString() === req.user._id.toString());

    res.json({ success: true, data: ranked, myEntry });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Subject-wise leaderboard
router.get('/subject/:subject', protect, async (req, res) => {
  try {
    const quizIds = await Quiz.find({ subject: new RegExp(req.params.subject, 'i'), isPublished: true }).distinct('_id');
    const pipeline = [
      { $match: { quiz: { $in: quizIds }, status: 'completed' } },
      { $group: { _id: '$student', avgScore: { $avg: '$percentage' }, totalAttempts: { $sum: 1 }, totalMarks: { $sum: '$obtainedMarks' } } },
      { $sort: { avgScore: -1 } },
      { $limit: 50 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      { $project: { 'student.name': 1, 'student.department': 1, 'student.totalPoints': 1, avgScore: 1, totalAttempts: 1 } }
    ];
    const data = await Attempt.aggregate(pipeline);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
