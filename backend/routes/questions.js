const express  = require('express');
const router   = express.Router();
const Question = require('../models/Question');
const Quiz     = require('../models/Quiz');
const { protect, authorize } = require('../middleware/auth');

// GET /api/questions/quiz/:quizId
router.get('/quiz/:quizId', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    // Students: only see questions for published quizzes
    if (req.user.role === 'student' && !quiz.isPublished)
      return res.status(403).json({ success: false, message: 'Quiz not available' });
    const questions = await Question.find({ quiz: req.params.quizId }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: questions });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/questions  (add single)
router.post('/', protect, authorize('faculty'), async (req, res) => {
  try {
    const { quizId, ...qData } = req.body;
    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    const question = await Question.create({ ...qData, quiz: quizId, createdBy: req.user._id, order: quiz.questions.length });
    quiz.questions.push(question._id);
    quiz.totalMarks  = (quiz.totalMarks  || 0) + (question.marks || 1);
    quiz.passingMarks = quiz.passingMarks || Math.ceil(quiz.totalMarks * 0.5);
    await quiz.save();
    res.status(201).json({ success: true, message: 'Question added', data: question });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/questions/bulk
router.post('/bulk', protect, authorize('faculty'), async (req, res) => {
  try {
    const { quizId, questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0)
      return res.status(400).json({ success: false, message: 'No questions provided' });
    const quiz = await Quiz.findOne({ _id: quizId, createdBy: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    const withMeta = questions.map((q, i) => ({ ...q, quiz: quizId, createdBy: req.user._id, order: quiz.questions.length + i }));
    const created  = await Question.insertMany(withMeta);
    quiz.questions.push(...created.map(q => q._id));
    quiz.totalMarks   += created.reduce((s, q) => s + (q.marks || 1), 0);
    quiz.passingMarks  = quiz.passingMarks || Math.ceil(quiz.totalMarks * 0.5);
    await quiz.save();
    res.status(201).json({ success: true, message: `${created.length} questions added`, data: created });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/questions/:id
router.put('/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question updated', data: question });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/questions/:id
router.delete('/:id', protect, authorize('faculty'), async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    await Quiz.findByIdAndUpdate(question.quiz, {
      $pull: { questions: question._id },
      $inc:  { totalMarks: -(question.marks || 1) }
    });
    res.json({ success: true, message: 'Question deleted' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
