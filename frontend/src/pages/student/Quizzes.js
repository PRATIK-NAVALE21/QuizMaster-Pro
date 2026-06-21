import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FiSearch, FiClock, FiBook, FiArrowRight, FiFilter, FiLock, FiUsers, FiBarChart2 } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import styles from './Quizzes.module.css';

const DIFF_CONFIG = { easy:{color:'#15803d',bg:'#dcfce7'}, medium:{color:'#854d0e',bg:'#fef9c3'}, hard:{color:'#dc2626',bg:'#fee2e2'} };

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [subject, setSubject] = useState('');
  const [myAttempts, setMyAttempts] = useState({});
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/quizzes', { params: { search, difficulty, subject, limit:100 } }),
      api.get('/attempts/my')
    ]).then(([qRes, aRes]) => {
      const qs = qRes.data.data;
      setQuizzes(qs);
      const subs = [...new Set(qs.map(q => q.subject))].filter(Boolean);
      setSubjects(subs);
      const map = {};
      aRes.data.data.forEach(a => { if(a.quiz?._id) map[a.quiz._id] = a; });
      setMyAttempts(map);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, difficulty, subject]);

  const clearFilters = () => { setSearch(''); setDifficulty(''); setSubject(''); };
  const hasFilters = search || difficulty || subject;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div><h1>Browse Quizzes</h1><p>{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available</p></div>
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.searchIcon}/>
            <input type="text" placeholder="Search by title, subject..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput}/>
            {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
          </div>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={styles.filterSelect}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={subject} onChange={e => setSubject(e.target.value)} className={styles.filterSelect}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && <button className={styles.clearBtn} onClick={clearFilters}><FiFilter size={13}/> Clear</button>}
        </div>

        {loading ? (
          <div className={styles.center}><div className="spinner"/></div>
        ) : quizzes.length === 0 ? (
          <div className={styles.empty}>
            <MdQuiz size={60} color="var(--gray-300)"/>
            <h2>No quizzes found</h2>
            <p>{hasFilters ? 'Try adjusting your filters.' : 'No quizzes have been published yet.'}</p>
            {hasFilters && <button className={styles.clearBtn2} onClick={clearFilters}>Clear Filters</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {quizzes.map(quiz => {
              const attempt = myAttempts[quiz._id];
              const dc = DIFF_CONFIG[quiz.difficulty] || DIFF_CONFIG.medium;
              return (
                <div key={quiz._id} className={`${styles.card} ${attempt ? styles.cardAttempted : ''}`}>
                  <div className={styles.cardTop}>
                    <span className={styles.subjectTag}>{quiz.subject}</span>
                    <span className={styles.diffTag} style={{color:dc.color, background:dc.bg}}>{quiz.difficulty}</span>
                    {quiz.accessCode && <FiLock size={13} color="var(--gray-400)" title="Access code required"/>}
                  </div>
                  <h3 className={styles.cardTitle}>{quiz.title}</h3>
                  {quiz.description && <p className={styles.cardDesc}>{quiz.description}</p>}

                  <div className={styles.cardMeta}>
                    <span><FiBook size={13}/> {quiz.questions?.length} Q's</span>
                    <span><FiClock size={13}/> {quiz.duration} min</span>
                    <span><FiUsers size={13}/> {quiz.attemptCount||0} taken</span>
                    {quiz.averageScore > 0 && <span><FiBarChart2 size={13}/> {parseFloat(quiz.averageScore).toFixed(0)}% avg</span>}
                  </div>

                  {attempt && (
                    <div className={`${styles.attemptBanner} ${attempt.isPassed ? styles.bannerPass : styles.bannerFail}`}>
                      {attempt.isPassed ? '✅' : '❌'} Your score: <strong>{attempt.percentage?.toFixed(0)}%</strong> · {attempt.isPassed ? 'Passed' : 'Failed'}
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    {attempt ? (
                      <>
                        <Link to={`/student/result/${attempt._id}`} className={styles.btnOutline}>View Result</Link>
                        {quiz.maxAttempts > 1 && <Link to={`/student/quiz/${quiz._id}`} className={styles.btnPrimary}>Retake <FiArrowRight size={13}/></Link>}
                      </>
                    ) : (
                      <Link to={`/student/quiz/${quiz._id}`} className={styles.btnPrimary}>Start Quiz <FiArrowRight size={13}/></Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
