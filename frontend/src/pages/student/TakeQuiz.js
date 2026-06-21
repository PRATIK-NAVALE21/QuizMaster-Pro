import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiClock, FiFlag, FiAlertTriangle, FiCheckCircle, FiChevronLeft, FiChevronRight, FiSend } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import styles from './TakeQuiz.module.css';

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [warnings, setWarnings] = useState(0);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnMsg, setWarnMsg] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const questionRefs = useRef({});

  useEffect(() => {
    api.get(`/quizzes/${id}`).then(r => { setQuiz(r.data.data); setTimeLeft(r.data.data.duration * 60); setPhase('intro'); })
      .catch(() => { toast.error('Quiz not found'); navigate('/student/quizzes'); });
  }, [id, navigate]);

  const submitQuiz = useCallback(async (reason = 'manual') => {
    if (!attempt) return;
    setPhase('submitting');
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startRef.current) / 1000);
    const ansArr = questions.map(q => ({ questionId: q._id, selectedOption: answers[q._id] ?? null, flagged: flagged.has(q._id), timeTaken: 0 }));
    try {
      const res = await api.post(`/attempts/${attempt._id}/submit`, { answers: ansArr, timeTaken });
      if (reason === 'timeout') toast('⏰ Time up! Quiz auto-submitted.', { icon: '⏰' });
      else if (reason === 'disqualified') toast.error('You have been disqualified due to violations.');
      else toast.success('Quiz submitted successfully!');
      navigate(`/student/result/${res.data.data._id}`);
    } catch (err) { toast.error('Submission failed. Try again.'); setPhase('exam'); }
  }, [attempt, answers, questions, flagged, navigate]);

  // Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); submitQuiz('timeout'); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitQuiz]);

  // Anti-cheat: tab switch
  useEffect(() => {
    if (phase !== 'exam') return;
    const handleVisibility = () => {
      if (document.hidden && quiz?.antiCheat?.preventTabSwitch) {
        api.post(`/attempts/${attempt?._id}/anticheat`, { event: 'tab_switch', details: 'User switched tab' }).then(r => {
          const w = r.data.warningCount || 0;
          setWarnings(w);
          setWarnMsg(`⚠️ Tab switching detected! Warning ${w}/${quiz?.antiCheat?.maxWarnings||3}`);
          setShowWarnModal(true);
          if (r.data.disqualified) submitQuiz('disqualified');
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase, attempt, quiz, submitQuiz]);

  // Anti-cheat: right-click & copy
  useEffect(() => {
    if (phase !== 'exam') return;
    const prevent = (e) => { if (quiz?.antiCheat?.preventRightClick) e.preventDefault(); };
    const preventCopy = (e) => { if (quiz?.antiCheat?.preventCopyPaste) { e.preventDefault(); api.post(`/attempts/${attempt?._id}/anticheat`, { event: 'copy_attempt', details: 'Copy blocked' }); } };
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    return () => { document.removeEventListener('contextmenu', prevent); document.removeEventListener('copy', preventCopy); document.removeEventListener('cut', preventCopy); };
  }, [phase, attempt, quiz]);

  const startExam = async () => {
    try {
      const [aRes, qRes] = await Promise.all([
        api.post('/attempts/start', { quizId: id, accessCode: accessCode || undefined }),
        api.get(`/questions/quiz/${id}`)
      ]);
      setAttempt(aRes.data.data);
      setQuestions(qRes.data.data);
      startRef.current = Date.now();
      setPhase('exam');
    } catch (err) { toast.error(err.response?.data?.message || 'Could not start quiz'); }
  };

  const handleAnswer = (optIdx) => setAnswers(prev => ({ ...prev, [questions[currentIdx]._id]: optIdx }));
  const toggleFlag = (qId) => setFlagged(prev => { const s = new Set(prev); s.has(qId) ? s.delete(qId) : s.add(qId); return s; });

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const answered = Object.keys(answers).length;
  const urgent = timeLeft < 120;
  const progress = questions.length ? (answered / questions.length) * 100 : 0;

  if (phase === 'loading') return <div className={styles.fullCenter}><div className="spinner"/></div>;

  if (phase === 'submitting') return (
    <div className={styles.fullCenter}>
      <div className={styles.submitCard}>
        <div className={styles.submitSpinner}><div className="spinner"/></div>
        <h2>Submitting your quiz…</h2>
        <p>Evaluating your answers. Please wait.</p>
      </div>
    </div>
  );

  if (phase === 'intro') return (
    <div className={styles.introPage}>
      <div className={styles.introCard}>
        <div className={styles.introIcon}><MdQuiz size={36} color="var(--primary)"/></div>
        <div className={`${styles.diffPill} ${styles[quiz?.difficulty]}`}>{quiz?.difficulty}</div>
        <h1>{quiz?.title}</h1>
        <p className={styles.introSubj}>{quiz?.subject}</p>
        {quiz?.description && <p className={styles.introDesc}>{quiz.description}</p>}
        <div className={styles.infoGrid}>
          {[['📝', quiz?.questions?.length||0, 'Questions'],['⏱️', `${quiz?.duration}m`, 'Duration'],['⭐', quiz?.totalMarks, 'Total Marks'],['✅', quiz?.passingMarks, 'Pass Marks'],['🔁', quiz?.maxAttempts, 'Max Attempts']].map(([e,v,l]) => (
            <div key={l} className={styles.infoItem}><span>{e}</span><strong>{v}</strong><small>{l}</small></div>
          ))}
        </div>
        {quiz?.antiCheat?.preventTabSwitch && (
          <div className={styles.antiCheatNote}>
            <FiAlertTriangle color="#d97706"/> <strong>Anti-cheat enabled:</strong> Tab switching, copy-paste, and right-click are monitored. {quiz.antiCheat.maxWarnings} warnings = disqualification.
          </div>
        )}
        {quiz?.accessCode && (
          <div className={styles.codeField}>
            <label>Access Code Required</label>
            <input type="text" placeholder="Enter quiz access code" value={accessCode} onChange={e => setAccessCode(e.target.value)} className={styles.codeInput}/>
          </div>
        )}
        {quiz?.instructions && <div className={styles.instructions}><strong>📋 Instructions:</strong><p>{quiz.instructions}</p></div>}
        <ul className={styles.rules}>
          <li>✔ Navigate between questions freely using the palette</li>
          <li>✔ Flag questions to revisit before submitting</li>
          <li>✔ Timer auto-submits when time runs out</li>
          <li>✔ Do not refresh the page during the exam</li>
        </ul>
        <button className={styles.startBtn} onClick={startExam}><FiCheckCircle/> Start Exam Now</button>
      </div>
    </div>
  );

  const q = questions[currentIdx];
  const sel = answers[q?._id];
  const isFlagged = flagged.has(q?._id);

  return (
    <div className={styles.examPage}>
      {/* Warning Modal */}
      {showWarnModal && (
        <div className={styles.warnOverlay}>
          <div className={styles.warnModal}>
            <FiAlertTriangle size={32} color="#d97706"/>
            <h3>Warning Issued</h3>
            <p>{warnMsg}</p>
            <button className={styles.warnOk} onClick={() => setShowWarnModal(false)}>I Understand</button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <MdQuiz size={20} color="var(--primary)"/>
          <div>
            <div className={styles.quizName}>{quiz?.title}</div>
            <div className={styles.quizSub}>{quiz?.subject}</div>
          </div>
        </div>
        <div className={styles.topMid}>
          <div className={styles.progressWrap}>
            <div className={styles.progressFill} style={{width:`${progress}%`}}/>
          </div>
          <span className={styles.progressTxt}>{answered}/{questions.length} answered</span>
        </div>
        <div className={styles.topRight}>
          {warnings > 0 && <div className={styles.warnCount}><FiAlertTriangle size={13}/> {warnings} warn</div>}
          <div className={`${styles.timer} ${urgent?styles.timerUrgent:''}`}>
            <FiClock size={15}/> {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Question area */}
        <div className={styles.qArea}>
          <div className={styles.qMeta}>
            <span className={styles.qNum}>Question {currentIdx+1} <span className={styles.qOf}>of {questions.length}</span></span>
            <div className={styles.qTags}>
              <span className={`${styles.qDiff} ${styles[q?.difficulty]}`}>{q?.difficulty}</span>
              <span className={styles.qMarks}>{q?.marks} mark{q?.marks!==1?'s':''}</span>
              {q?.negativeMark>0 && <span className={styles.qNeg}>-{q?.negativeMark} penalty</span>}
            </div>
            <button className={`${styles.flagBtn} ${isFlagged?styles.flagged:''}`} onClick={() => toggleFlag(q?._id)}>
              <FiFlag size={14}/> {isFlagged?'Flagged':'Flag'}
            </button>
          </div>

          <p className={styles.qText}>{q?.text}</p>

          <div className={styles.options}>
            {q?.options?.map((opt, i) => (
              <button key={i} className={`${styles.opt} ${sel===i?styles.optSel:''}`} onClick={() => handleAnswer(i)}>
                <div className={`${styles.optLetter} ${sel===i?styles.optLetterSel:''}`}>{String.fromCharCode(65+i)}</div>
                <span className={styles.optText}>{opt.text}</span>
                {sel===i && <FiCheckCircle className={styles.optCheck} size={18}/>}
              </button>
            ))}
          </div>

          <div className={styles.navRow}>
            <button className={styles.navBtn} onClick={() => setCurrentIdx(i=>i-1)} disabled={currentIdx===0}><FiChevronLeft/> Previous</button>
            <div className={styles.navCenter}>
              {sel===undefined && <span className={styles.notAnswered}>Not answered</span>}
              {sel!==undefined && <span className={styles.isAnswered}><FiCheckCircle size={13}/> Answered</span>}
            </div>
            {currentIdx < questions.length-1
              ? <button className={`${styles.navBtn} ${styles.navNext}`} onClick={() => setCurrentIdx(i=>i+1)}>Next <FiChevronRight/></button>
              : <button className={`${styles.navBtn} ${styles.navSubmit}`} onClick={() => { if(window.confirm(`Submit? ${questions.length-answered} unanswered.`)) submitQuiz(); }}><FiSend/> Submit Quiz</button>
            }
          </div>
        </div>

        {/* Palette */}
        <div className={styles.palette}>
          <div className={styles.palHead}>Question Palette</div>
          <div className={styles.palGrid}>
            {questions.map((q,i) => {
              const isAns = answers[q._id]!==undefined;
              const isFl = flagged.has(q._id);
              const isCur = i===currentIdx;
              return (
                <button key={i} className={`${styles.palBtn} ${isCur?styles.palCur:isAns?styles.palAns:''} ${isFl?styles.palFlag:''}`} onClick={() => setCurrentIdx(i)}>
                  {isFl && <span className={styles.palFlagDot}/>}{i+1}
                </button>
              );
            })}
          </div>
          <div className={styles.palLegend}>
            <div className={styles.legRow}><div className={`${styles.legBox} ${styles.palAns}`}/> Answered</div>
            <div className={styles.legRow}><div className={`${styles.legBox} ${styles.palFlag}`}/> Flagged</div>
            <div className={styles.legRow}><div className={styles.legBox}/> Not answered</div>
            <div className={styles.legRow}><div className={`${styles.legBox} ${styles.palCur}`}/> Current</div>
          </div>
          <button className={styles.submitFullBtn} onClick={() => { if(window.confirm(`Submit quiz? ${questions.length-answered} question(s) unanswered.`)) submitQuiz(); }}>
            <FiSend/> Submit Quiz ({answered}/{questions.length})
          </button>
        </div>
      </div>
    </div>
  );
}
