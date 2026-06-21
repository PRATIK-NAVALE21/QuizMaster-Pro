import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FiCheckCircle, FiXCircle, FiArrowLeft,   FiStar, FiDownload } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import { format } from 'date-fns';
import styles from './QuizResult.module.css';

export default function QuizResult() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    api.get(`/attempts/${id}`).then(r => {
      setAttempt(r.data.data);
      if (r.data.data.feedback?.rating) { setRating(r.data.data.feedback.rating); setFeedbackSent(true); }
      if (r.data.data.certificateIssued) {
        api.get(`/certificates/${id}`).then(cr => setCertData(cr.data.data)).catch(() => {});
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const submitFeedback = async () => {
    if (!rating) return;
    try {
      await api.post(`/attempts/${id}/feedback`, { rating, comment: feedbackComment });
      setFeedbackSent(true);
    } catch { /* silent */ }
  };

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;
  if (!attempt) return <Layout><div className={styles.center}><p>Result not found.</p></div></Layout>;

  const { quiz, answers, obtainedMarks, totalMarks, percentage, isPassed, timeTaken, rank, pointsEarned } = attempt;
  const correct   = answers.filter(a => a.isCorrect).length;
  const wrong     = answers.filter(a => !a.isCorrect && a.selectedOption !== null && a.selectedOption !== undefined).length;
  const skipped   = answers.filter(a => a.selectedOption === null || a.selectedOption === undefined).length;
  const flagged   = answers.filter(a => a.flagged).length;
  const fmtTime   = s => s ? `${Math.floor(s/60)}m ${s%60}s` : '—';
  const circumference = 2 * Math.PI * 44;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.topActions}>
          <Link to="/student/quizzes" className={styles.back}><FiArrowLeft size={15}/> Back to Quizzes</Link>
          {certData && (
            <a href={`/verify-certificate/${certData.certificateId}`} target="_blank" rel="noreferrer" className={styles.certBtn}><FiDownload size={14}/> Download Certificate</a>
          )}
        </div>

        {/* Result hero */}
        <div className={`${styles.hero} ${isPassed ? styles.heroPass : styles.heroFail}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroEmoji}>{isPassed ? '🎉' : '😔'}</div>
            <h1>{isPassed ? 'Excellent Work!' : 'Keep Practicing!'}</h1>
            <p className={styles.heroQuiz}>{quiz?.title}</p>
            {rank && <div className={styles.rankBadge}>🏆 Rank #{rank} on this quiz</div>}
            {pointsEarned > 0 && <div className={styles.xpBadge}>⭐ +{pointsEarned} XP earned</div>}
          </div>
          <div className={styles.heroScore}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10"/>
              <circle cx="60" cy="60" r="44" fill="none" stroke="white" strokeWidth="10"
                strokeDasharray={`${(percentage/100)*circumference} ${circumference}`}
                strokeLinecap="round" transform="rotate(-90 60 60)" style={{transition:'stroke-dasharray 1.2s ease'}}/>
            </svg>
            <div className={styles.scoreOverlay}>
              <span className={styles.scorePct}>{percentage?.toFixed(0)}%</span>
              <span className={styles.scoreRaw}>{obtainedMarks}/{totalMarks}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          {[
            {icon:'✅', val: correct,       label:'Correct',    color:'#10b981', bg:'#dcfce7'},
            {icon:'❌', val: wrong,         label:'Wrong',      color:'#ef4444', bg:'#fee2e2'},
            {icon:'⏭️', val: skipped,       label:'Skipped',    color:'#f59e0b', bg:'#fef9c3'},
            {icon:'🚩', val: flagged,       label:'Flagged',    color:'#8b5cf6', bg:'#ede9fe'},
            {icon:'⏱️', val: fmtTime(timeTaken), label:'Time Taken', color:'#0ea5e9', bg:'#e0f2fe'},
            {icon:'🏆', val: rank ? `#${rank}` : '—', label:'Quiz Rank', color:'#d97706', bg:'#fef3c7'},
          ].map(s => (
            <div key={s.label} className={styles.statCard} style={{borderTopColor:s.color}}>
              <div className={styles.statEmoji}>{s.icon}</div>
              <div className={styles.statVal} style={{color:s.color}}>{s.val}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Certificate */}
        {certData && (
          <div className={styles.certCard}>
            <span>📜</span>
            <div><strong>Certificate Earned!</strong><p>You've qualified for a certificate on "{quiz?.title}". Score: {percentage?.toFixed(0)}%</p></div>
            <a href={`/verify-certificate/${certData.certificateId}`} target="_blank" rel="noreferrer" className={styles.certLink}>View Certificate →</a>
          </div>
        )}

        {/* Feedback */}
        {quiz?.feedbackEnabled && (
          <div className={styles.feedbackCard}>
            <h3><FiStar/> Rate this Quiz</h3>
            {feedbackSent ? (
              <div className={styles.feedbackDone}><FiCheckCircle color="#10b981"/> Thanks for your feedback!</div>
            ) : (
              <>
                <div className={styles.stars}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} className={`${styles.star} ${rating>=n?styles.starOn:''}`} onClick={() => setRating(n)}>★</button>
                  ))}
                </div>
                <textarea className={styles.feedbackInput} placeholder="Any comments about this quiz? (optional)" value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} rows={2}/>
                <button className={styles.feedbackBtn} onClick={submitFeedback} disabled={!rating}>Submit Feedback</button>
              </>
            )}
          </div>
        )}

        {/* Answer Review */}
        {quiz?.showResults && (
          <div className={styles.reviewSection}>
            <div className={styles.reviewHead}><h2>📋 Answer Review</h2><span>{correct}/{answers.length} correct</span></div>
            <div className={styles.reviewList}>
              {answers.map((ans, idx) => {
                const q = ans.question;
                const notAns = ans.selectedOption === null || ans.selectedOption === undefined;
                return (
                  <div key={idx} className={`${styles.reviewCard} ${ans.isCorrect?styles.rcCorrect:notAns?styles.rcSkip:styles.rcWrong}`}>
                    <div className={styles.rcTop}>
                      <span className={styles.rcIdx}>Q{idx+1}</span>
                      {ans.flagged && <span className={styles.rcFlagged}>🚩 Flagged</span>}
                      <span className={`${styles.rcStatus} ${ans.isCorrect?styles.rcStatusPass:notAns?styles.rcStatusSkip:styles.rcStatusFail}`}>
                        {ans.isCorrect?'✅ Correct':notAns?'⏭ Skipped':'❌ Wrong'}
                      </span>
                      <span className={styles.rcMarks}>{ans.marksAwarded>0?`+${ans.marksAwarded}`:ans.marksAwarded} marks</span>
                    </div>
                    <p className={styles.rcQ}>{q?.text}</p>
                    <div className={styles.rcOptions}>
                      {q?.options?.map((opt, i) => {
                        const isSel = ans.selectedOption === i;
                        const isCorr = opt.isCorrect;
                        return (
                          <div key={i} className={`${styles.rcOpt} ${isCorr?styles.rcOptCorr:''} ${isSel&&!isCorr?styles.rcOptWrong:''}`}>
                            <span className={styles.rcLetter}>{String.fromCharCode(65+i)}</span>
                            <span>{opt.text}</span>
                            {isCorr && <FiCheckCircle className={styles.rcIcon} color="#10b981"/>}
                            {isSel&&!isCorr && <FiXCircle className={styles.rcIcon} color="#ef4444"/>}
                          </div>
                        );
                      })}
                    </div>
                    {q?.explanation && <div className={styles.rcExpl}>💡 {q.explanation}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.bottomActions}>
          <Link to="/student/quizzes" className={styles.btnOutline}><FiArrowLeft/> Browse Quizzes</Link>
          <Link to="/student/dashboard" className={styles.btnPrimary}><MdQuiz/> Dashboard</Link>
        </div>
      </div>
    </Layout>
  );
}
