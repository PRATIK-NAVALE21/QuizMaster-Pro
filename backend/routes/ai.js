const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.post('/generate', protect, authorize('faculty'), async (req, res) => {
  try {
    const { topic, subject, difficulty = 'medium', count = 5, additionalContext = '' } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });
    if (!process.env.GEMINI_API_KEY)
      return res.status(500).json({ success: false, message: 'Gemini API key not configured. Add GEMINI_API_KEY to your .env file.' });

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Generate exactly ${count} multiple choice questions (MCQ) about: "${topic}"
Subject: ${subject || topic}
Difficulty: ${difficulty}
${additionalContext ? `Context: ${additionalContext}` : ''}

CRITICAL: Respond ONLY with a valid JSON array. No markdown, no explanation, no backticks.
Each question must follow this exact structure:
[
  {
    "text": "The question text?",
    "options": [
      {"text": "Option A text", "isCorrect": false},
      {"text": "Option B text", "isCorrect": true},
      {"text": "Option C text", "isCorrect": false},
      {"text": "Option D text", "isCorrect": false}
    ],
    "explanation": "Brief explanation of the correct answer",
    "difficulty": "${difficulty}",
    "marks": 1,
    "negativeMark": 0
  }
]
Rules:
- Exactly 4 options per question
- Exactly ONE option with isCorrect: true
- Questions must be clear and unambiguous
- Options must be plausible distractors
- ${difficulty === 'easy' ? 'Basic recall and understanding' : difficulty === 'medium' ? 'Application and analysis' : 'Synthesis and evaluation'}`;

    const result  = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean up response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) text = match[0];
    else text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const questions = JSON.parse(text);
    if (!Array.isArray(questions)) throw new Error('Invalid AI response format');

    const validated = questions.slice(0, count).map(q => ({
      text:         String(q.text || '').trim(),
      type:         'mcq',
      options:      (q.options || []).slice(0, 4).map(o => ({ text: String(o.text || '').trim(), isCorrect: Boolean(o.isCorrect) })),
      explanation:  String(q.explanation || '').trim(),
      difficulty:   q.difficulty || difficulty,
      marks:        Number(q.marks) || 1,
      negativeMark: Number(q.negativeMark) || 0,
      isAIGenerated: true,
    })).filter(q => q.text && q.options.length >= 2 && q.options.some(o => o.isCorrect));

    res.json({ success: true, message: `${validated.length} questions generated`, data: validated });
  } catch(err) {
    console.error('Gemini error:', err.message);
    if (err.message?.includes('API_KEY') || err.message?.includes('API key'))
      return res.status(500).json({ success: false, message: 'Invalid or missing Gemini API key' });
    if (err instanceof SyntaxError)
      return res.status(500).json({ success: false, message: 'AI returned invalid format. Try again.' });
    res.status(500).json({ success: false, message: 'AI generation failed: ' + err.message });
  }
});

router.post('/improve', protect, authorize('faculty'), async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question required' });
    if (!process.env.GEMINI_API_KEY)
      return res.status(500).json({ success: false, message: 'Gemini API key not configured' });
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`Improve this MCQ question and its options to be clearer and more professional. Return ONLY JSON in the same format:\n${JSON.stringify(question)}`);
    let text = result.response.text().trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const improved = JSON.parse(text);
    res.json({ success: true, data: improved });
  } catch(err) {
    res.status(500).json({ success: false, message: 'AI improvement failed: ' + err.message });
  }
});

module.exports = router;
