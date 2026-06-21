const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Faculty: deep analytics for a quiz
router.get('/quiz/:quizId', protect, authorize('faculty'), async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.quizId, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const attempts = await Attempt.find({ quiz: req.params.quizId, status: 'completed' })
      .populate('answers.question', 'text options marks');

    // Per-question accuracy
    const questions = await Question.find({ quiz: req.params.quizId });
    const qStats = questions.map(q => {
      const qAnswers = attempts.flatMap(a => a.answers.filter(ans => ans.question?._id?.toString() === q._id.toString() || ans.question?.toString() === q._id.toString()));
      const correct = qAnswers.filter(a => a.isCorrect).length;
      const total = qAnswers.length;
      return {
        _id: q._id,
        text: q.text.substring(0, 80),
        accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) : 0,
        totalAnswered: total,
        correct,
        difficulty: q.difficulty,
        avgTime: qAnswers.length > 0 ? (qAnswers.reduce((s, a) => s + (a.timeTaken || 0), 0) / qAnswers.length).toFixed(0) : 0
      };
    });

    // Score buckets
    const buckets = [
      { range: '0-20', min: 0, max: 20 }, { range: '21-40', min: 21, max: 40 },
      { range: '41-60', min: 41, max: 60 }, { range: '61-80', min: 61, max: 80 },
      { range: '81-100', min: 81, max: 100 }
    ].map(b => ({ ...b, count: attempts.filter(a => a.percentage >= b.min && a.percentage <= b.max).length }));

    // Time series - attempts per day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timeSeries = await Attempt.aggregate([
      { $match: { quiz: quiz._id, status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
      { $sort: { _id: 1 } }
    ]);

    // Anti-cheat summary
    const antiCheatStats = {
      warnings: attempts.reduce((s, a) => s + (a.warningCount || 0), 0),
      disqualified: attempts.filter(a => a.isDisqualified).length,
      tabSwitches: attempts.reduce((s, a) => s + (a.antiCheatLog?.filter(l => l.event === 'tab_switch').length || 0), 0),
      focusLost: attempts.reduce((s, a) => s + (a.focusLostCount || 0), 0)
    };

    res.json({
      success: true,
      data: {
        summary: {
          totalAttempts: attempts.length,
          passCount: attempts.filter(a => a.isPassed).length,
          avgScore: attempts.length ? (attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length).toFixed(1) : 0,
          avgTime: attempts.length ? (attempts.reduce((s, a) => s + (a.timeTaken || 0), 0) / attempts.length / 60).toFixed(1) : 0,
          highestScore: attempts.length ? Math.max(...attempts.map(a => a.percentage)).toFixed(1) : 0,
          lowestScore: attempts.length ? Math.min(...attempts.map(a => a.percentage)).toFixed(1) : 0
        },
        questionStats: qStats,
        scoreDistribution: buckets,
        timeSeries,
        antiCheatStats
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Student: personal analytics
router.get('/student/me', protect, authorize('student'), async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id, status: 'completed' })
      .populate('quiz', 'subject title difficulty');

    // Subject-wise breakdown
    const subjectMap = {};
    attempts.forEach(a => {
      const sub = a.quiz?.subject || 'Unknown';
      if (!subjectMap[sub]) subjectMap[sub] = { total: 0, sum: 0, passed: 0 };
      subjectMap[sub].total++;
      subjectMap[sub].sum += a.percentage;
      if (a.isPassed) subjectMap[sub].passed++;
    });
    const subjectStats = Object.entries(subjectMap).map(([subject, v]) => ({
      subject, attempts: v.total, avgScore: (v.sum / v.total).toFixed(1), passRate: ((v.passed / v.total) * 100).toFixed(0)
    }));

    // Weekly activity (last 8 weeks)
    const weeklyActivity = await Attempt.aggregate([
      { $match: { student: req.user._id, status: 'completed', createdAt: { $gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $week: '$createdAt' }, count: { $sum: 1 }, avgScore: { $avg: '$percentage' } } },
      { $sort: { _id: 1 } }
    ]);

    // Improvement trend
    const recentAttempts = attempts.slice(-10).map((a, i) => ({ index: i + 1, score: a.percentage, date: a.createdAt }));

    res.json({
      success: true,
      data: {
        totalAttempts: attempts.length,
        passRate: attempts.length ? ((attempts.filter(a => a.isPassed).length / attempts.length) * 100).toFixed(1) : 0,
        avgScore: attempts.length ? (attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length).toFixed(1) : 0,
        totalPoints: req.user.totalPoints,
        level: req.user.level,
        streak: req.user.streak,
        badges: req.user.badges,
        subjectStats,
        weeklyActivity,
        recentTrend: recentAttempts
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
