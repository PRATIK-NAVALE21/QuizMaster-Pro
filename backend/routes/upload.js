const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const XLSX    = require('xlsx');
const path    = require('path');
const fs      = require('fs');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`),
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.xlsx', '.xls', '.csv'];
  const ext     = path.extname(file.originalname).toLowerCase();
  allowed.includes(ext) ? cb(null, true) : cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/upload/questions
router.post('/questions', protect, authorize('faculty'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const wb    = XLSX.readFile(req.file.path);
    const ws    = wb.Sheets[wb.SheetNames[0]];
    const rows  = XLSX.utils.sheet_to_json(ws, { header: 1 });
    fs.unlinkSync(req.file.path);

    if (rows.length < 2) return res.status(400).json({ success: false, message: 'File has no data rows' });

    const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
    const questions = [], errors = [];

    const colIdx = (...names) => {
      for (const n of names) {
        const i = headers.findIndex(h => h.includes(n));
        if (i !== -1) return i;
      }
      return -1;
    };
    const getVal = (row, ...names) => {
      const i = colIdx(...names);
      return i !== -1 && row[i] !== undefined ? String(row[i]).trim() : '';
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(c => !c)) continue;
      try {
        const text  = getVal(row, 'question', 'text', 'q');
        const optA  = getVal(row, 'option a', 'option_a', 'a)', 'a.', 'opt_a', 'option1', 'opta');
        const optB  = getVal(row, 'option b', 'option_b', 'b)', 'b.', 'opt_b', 'option2', 'optb');
        const optC  = getVal(row, 'option c', 'option_c', 'c)', 'c.', 'opt_c', 'option3', 'optc');
        const optD  = getVal(row, 'option d', 'option_d', 'd)', 'd.', 'opt_d', 'option4', 'optd');
        const correct     = getVal(row, 'correct', 'answer', 'correct answer', 'correct_answer').toLowerCase();
        const explanation = getVal(row, 'explanation', 'reason', 'solution', 'note');
        const marks       = parseFloat(getVal(row, 'marks', 'points', 'score')) || 1;
        const difficulty  = getVal(row, 'difficulty', 'level') || 'medium';

        if (!text) { errors.push(`Row ${i + 1}: Question text is missing`); continue; }
        if (!optA || !optB) { errors.push(`Row ${i + 1}: Options A and B are required`); continue; }

        const cMap = { a: 0, 'a)': 0, '1': 0, b: 1, 'b)': 1, '2': 1, c: 2, 'c)': 2, '3': 2, d: 3, 'd)': 3, '4': 3 };
        const correctIdx = cMap[correct] ?? -1;

        const options = [
          { text: optA, isCorrect: correctIdx === 0 },
          { text: optB, isCorrect: correctIdx === 1 },
          ...(optC ? [{ text: optC, isCorrect: correctIdx === 2 }] : []),
          ...(optD ? [{ text: optD, isCorrect: correctIdx === 3 }] : []),
        ];

        if (!options.some(o => o.isCorrect)) {
          options[0].isCorrect = true;
          errors.push(`Row ${i + 1}: Could not parse correct answer "${correct}", defaulting to Option A`);
        }

        questions.push({
          text, type: 'mcq', options, explanation, marks,
          difficulty: ['easy','medium','hard'].includes(difficulty.toLowerCase()) ? difficulty.toLowerCase() : 'medium',
          negativeMark: 0,
        });
      } catch(e) { errors.push(`Row ${i + 1}: ${e.message}`); }
    }

    res.json({ success: true, message: `Parsed ${questions.length} question(s)`, data: questions, errors });
  } catch(err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'File processing failed: ' + err.message });
  }
});

// GET /api/upload/template
router.get('/template', (req, res) => {
  const wb   = XLSX.utils.book_new();
  const data = [
    ['Question','Option A','Option B','Option C','Option D','Correct Answer','Explanation','Marks','Difficulty']
  ];
  const ws   = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    {wch:50},{wch:20},{wch:20},{wch:20},{wch:20},
    {wch:16},{wch:40},{wch:8},{wch:12}
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename=quizmaster_questions_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

module.exports = router;
