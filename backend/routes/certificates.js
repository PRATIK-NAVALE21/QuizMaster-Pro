const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Attempt = require('../models/Attempt');
const { protect } = require('../middleware/auth');

// Generate/get certificate for an attempt
router.get('/:attemptId', protect, async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('quiz', 'title subject certificateEnabled certificateMinScore createdBy')
      .populate('student', 'name email department');

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
    if (attempt.student._id.toString() !== req.user._id.toString() && req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!attempt.quiz.certificateEnabled) return res.status(400).json({ success: false, message: 'Certificates not enabled for this quiz' });
    if (attempt.percentage < attempt.quiz.certificateMinScore) {
      return res.status(400).json({ success: false, message: `Minimum ${attempt.quiz.certificateMinScore}% required for certificate` });
    }

    // Generate unique cert ID if not already issued
    if (!attempt.certificateId) {
      attempt.certificateId = uuidv4();
      attempt.certificateIssued = true;
      await attempt.save();
    }

    res.json({
      success: true,
      data: {
        certificateId: attempt.certificateId,
        studentName: attempt.student.name,
        quizTitle: attempt.quiz.title,
        subject: attempt.quiz.subject,
        score: attempt.percentage,
        obtainedMarks: attempt.obtainedMarks,
        totalMarks: attempt.totalMarks,
        issuedAt: attempt.updatedAt,
        department: attempt.student.department
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Verify a certificate by ID
router.get('/verify/:certId', async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ certificateId: req.params.certId })
      .populate('quiz', 'title subject')
      .populate('student', 'name department');
    if (!attempt) return res.status(404).json({ success: false, message: 'Invalid certificate' });
    res.json({
      success: true,
      valid: true,
      data: {
        studentName: attempt.student.name,
        quizTitle: attempt.quiz.title,
        subject: attempt.quiz.subject,
        score: attempt.percentage,
        issuedAt: attempt.updatedAt
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
