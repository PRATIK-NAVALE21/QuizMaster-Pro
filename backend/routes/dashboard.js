const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.get('/faculty', protect, authorize('faculty'), async (req, res) => {
  try {
    const myQuizIds = (await Quiz.find({ createdBy: req.user._id }).select('_id')).map(q => q._id);
    const [totalQuizzes, publishedQuizzes, totalQuestions, recentAttempts, topQuizzes, totalStudents] = await Promise.all([
      Quiz.countDocuments({ createdBy: req.user._id }),
      Quiz.countDocuments({ createdBy: req.user._id, isPublished: true }),
      Question.countDocuments({ createdBy: req.user._id }),
      Attempt.find({ quiz: { $in: myQuizIds }, status: 'completed' })
        .populate('quiz', 'title subject').populate('student', 'name email')
        .sort({ createdAt: -1 }).limit(10),
      Quiz.find({ createdBy: req.user._id }).select('title attemptCount averageScore isPublished subject').sort({ attemptCount: -1 }).limit(5),
      Attempt.distinct('student', { quiz: { $in: myQuizIds }, status: 'completed' })
    ]);

    const totalAttempts = await Attempt.countDocuments({ quiz: { $in: myQuizIds }, status: 'completed' });
    const passCount = await Attempt.countDocuments({ quiz: { $in: myQuizIds }, status: 'completed', isPassed: true });

    // Weekly trend
    const weeklyTrend = await Attempt.aggregate([
      { $match: { quiz: { $in: myQuizIds }, status: 'completed', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%a', date: '$createdAt' } }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalQuizzes, publishedQuizzes, totalQuestions, totalAttempts,
        totalStudents: totalStudents.length,
        passRate: totalAttempts > 0 ? ((passCount / totalAttempts) * 100).toFixed(1) : 0,
        recentAttempts, topQuizzes, weeklyTrend
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/student', protect, authorize('student'), async (req, res) => {
  try {
    const [attempts, availableQuizzes, totalAttempts] = await Promise.all([
      Attempt.find({ student: req.user._id, status: 'completed' })
        .populate('quiz', 'title subject difficulty totalMarks passingMarks').sort({ createdAt: -1 }).limit(6),
      Quiz.countDocuments({ isPublished: true, isActive: true }),
      Attempt.countDocuments({ student: req.user._id, status: 'completed' })
    ]);

    const avgScore = attempts.length ? (attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length).toFixed(1) : 0;
    const passCount = attempts.filter(a => a.isPassed).length;

    // Rank among all students
    const betterStudents = await User.countDocuments({ role: 'student', totalPoints: { $gt: req.user.totalPoints || 0 } });
    const globalRank = betterStudents + 1;

    res.json({
      success: true,
      data: {
        totalAttempts, averageScore: avgScore, passCount, availableQuizzes,
        totalPoints: req.user.totalPoints || 0,
        level: req.user.level || 1,
        streak: req.user.streak || 0,
        badges: req.user.badges || [],
        globalRank,
        recentAttempts: attempts
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
