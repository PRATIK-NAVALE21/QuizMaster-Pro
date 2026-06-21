const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

const BADGE_RULES = [
  { id: 'first_quiz', label: '🎯 First Quiz', check: (count) => count === 1 },
  { id: 'quiz_10', label: '📚 Quiz Enthusiast', check: (count) => count === 10 },
  { id: 'perfect_score', label: '💯 Perfect Score', check: (_, pct) => pct === 100 },
  { id: 'streak_3', label: '🔥 3-Day Streak', check: (_, __, streak) => streak >= 3 },
  { id: 'streak_7', label: '⚡ Week Warrior', check: (_, __, streak) => streak >= 7 },
];

// Start attempt
router.post('/start', protect, authorize('student'), async (req, res) => {
  try {
    const { quizId, accessCode } = req.body;
    const quiz = await Quiz.findById(quizId).populate('questions');
    if (!quiz || !quiz.isPublished) return res.status(404).json({ success: false, message: 'Quiz not found or not published' });

    // Access code check
    if (quiz.accessCode && quiz.accessCode !== accessCode) {
      return res.status(403).json({ success: false, message: 'Invalid access code' });
    }

    // Max attempts check
    const completedCount = await Attempt.countDocuments({ quiz: quizId, student: req.user._id, status: { $in: ['completed', 'timed_out'] } });
    if (completedCount >= quiz.maxAttempts) {
      return res.status(400).json({ success: false, message: `Maximum ${quiz.maxAttempts} attempt(s) allowed` });
    }

    // Resume in-progress
    const inProgress = await Attempt.findOne({ quiz: quizId, student: req.user._id, status: 'in_progress' });
    if (inProgress) return res.json({ success: true, message: 'Resuming attempt', data: inProgress });

    let questionsOrder = quiz.questions.map(q => q._id);
    if (quiz.shuffleQuestions || quiz.antiCheat?.randomizeQuestions) {
      questionsOrder = questionsOrder.sort(() => Math.random() - 0.5);
    }

    const attempt = await Attempt.create({
      quiz: quizId,
      student: req.user._id,
      totalMarks: quiz.totalMarks,
      attemptNumber: completedCount + 1,
      questionsOrder,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || ''
    });

    res.status(201).json({ success: true, message: 'Quiz started', data: attempt });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Log anti-cheat event
router.post('/:id/anticheat', protect, authorize('student'), async (req, res) => {
  try {
    const { event, details } = req.body;
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id, status: 'in_progress' });
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    attempt.antiCheatLog.push({ event, details, timestamp: new Date() });
    if (['tab_switch', 'copy_attempt', 'right_click', 'fullscreen_exit'].includes(event)) {
      attempt.warningCount = (attempt.warningCount || 0) + 1;
      if (event === 'tab_switch' || event === 'fullscreen_exit') attempt.focusLostCount = (attempt.focusLostCount || 0) + 1;
    }

    // Check if should disqualify
    const quiz = await Quiz.findById(attempt.quiz);
    if (quiz?.antiCheat?.maxWarnings && attempt.warningCount >= quiz.antiCheat.maxWarnings) {
      attempt.status = 'disqualified';
      attempt.isDisqualified = true;
      attempt.disqualificationReason = `Exceeded ${quiz.antiCheat.maxWarnings} warnings`;
    }

    await attempt.save();
    res.json({ success: true, warningCount: attempt.warningCount, disqualified: attempt.isDisqualified });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Submit attempt
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const attempt = await Attempt.findOne({ _id: req.params.id, student: req.user._id, status: 'in_progress' });
    if (!attempt) return res.status(404).json({ success: false, message: 'Active attempt not found' });

    const quiz = await Quiz.findById(attempt.quiz);
    const questions = await Question.find({ quiz: attempt.quiz });

    let obtainedMarks = 0;
    const processedAnswers = (answers || []).map(ans => {
      const q = questions.find(q => q._id.toString() === ans.questionId);
      if (!q) return { question: ans.questionId, selectedOption: ans.selectedOption, isCorrect: false, marksAwarded: 0 };
      const correctIdx = q.options.findIndex(o => o.isCorrect);
      const isCorrect = ans.selectedOption === correctIdx;
      const marksAwarded = isCorrect ? q.marks : -(q.negativeMark || 0);
      obtainedMarks += marksAwarded;
      // Update question analytics
      Question.findByIdAndUpdate(q._id, { $inc: { timesAnswered: 1, ...(isCorrect && { timesCorrect: 1 }) } }).exec();
      return { question: ans.questionId, selectedOption: ans.selectedOption, isCorrect, marksAwarded, timeTaken: ans.timeTaken || 0, flagged: ans.flagged || false };
    });

    obtainedMarks = Math.max(0, obtainedMarks);
    const percentage = quiz.totalMarks > 0 ? parseFloat(((obtainedMarks / quiz.totalMarks) * 100).toFixed(2)) : 0;
    const isPassed = obtainedMarks >= quiz.passingMarks;

    // Calculate rank
    const betterAttempts = await Attempt.countDocuments({ quiz: quiz._id, status: 'completed', percentage: { $gt: percentage } });
    const rank = betterAttempts + 1;

    // Points system
    let pointsEarned = 0;
    if (isPassed) {
      pointsEarned = Math.round(percentage / 10) * 5 + (quiz.pointsOnPass || 10);
    }

    attempt.answers = processedAnswers;
    attempt.obtainedMarks = obtainedMarks;
    attempt.percentage = percentage;
    attempt.isPassed = isPassed;
    attempt.status = 'completed';
    attempt.endTime = new Date();
    attempt.timeTaken = timeTaken || 0;
    attempt.rank = rank;
    attempt.pointsEarned = pointsEarned;
    await attempt.save();

    // Update quiz stats
    const allCompleted = await Attempt.find({ quiz: quiz._id, status: 'completed' });
    quiz.attemptCount = allCompleted.length;
    quiz.averageScore = allCompleted.reduce((s, a) => s + a.percentage, 0) / allCompleted.length;
    await quiz.save();

    // Update student points + streak + badges
    const user = await User.findById(req.user._id);
    user.totalPoints = (user.totalPoints || 0) + pointsEarned;
    user.level = Math.floor(user.totalPoints / 100) + 1;

    // Streak logic
    const today = new Date().toDateString();
    const lastDate = user.lastAttemptDate ? new Date(user.lastAttemptDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastDate === yesterday) user.streak = (user.streak || 0) + 1;
    else if (lastDate !== today) user.streak = 1;
    user.lastAttemptDate = new Date();

    // Badge checks
    const totalAttempts = allCompleted.filter(a => a.student.toString() === req.user._id.toString()).length;
    BADGE_RULES.forEach(rule => {
      if (!user.badges.includes(rule.id) && rule.check(totalAttempts, percentage, user.streak)) {
        user.badges.push(rule.id);
        Notification.create({ user: user._id, title: 'Badge Earned!', message: `You earned the "${rule.label}" badge!`, type: 'badge_earned', icon: '🏆' });
      }
    });

    await user.save();

    // Certificate check
    if (quiz.certificateEnabled && percentage >= quiz.certificateMinScore) {
      const { v4: uuidv4 } = require('uuid');
      attempt.certificateId = uuidv4();
      attempt.certificateIssued = true;
      await attempt.save();
      await Notification.create({ user: user._id, title: 'Certificate Earned!', message: `Congratulations! You earned a certificate for "${quiz.title}"`, type: 'badge_earned', icon: '📜' });
    }

    // Notify result ready
    await Notification.create({ user: user._id, title: 'Quiz Submitted!', message: `You scored ${percentage.toFixed(0)}% on "${quiz.title}"`, type: 'result_ready', icon: '📊', link: `/student/result/${attempt._id}` });

    res.json({ success: true, message: 'Quiz submitted!', data: attempt });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const attempts = await Attempt.find({ student: req.user._id })
      .populate('quiz', 'title subject difficulty duration totalMarks passingMarks')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: attempts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('quiz')
      .populate({ path: 'answers.question', model: 'Question' })
      .populate('student', 'name email');
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (req.user.role === 'student' && attempt.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: attempt });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Submit feedback for a quiz
router.post('/:id/feedback', protect, authorize('student'), async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const attempt = await Attempt.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id, status: 'completed' },
      { feedback: { rating, comment, submittedAt: new Date() } },
      { new: true }
    );
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    res.json({ success: true, message: 'Feedback submitted', data: attempt });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
