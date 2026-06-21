import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FiArrowRight, FiClock, FiBook, FiSearch } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import { format } from 'date-fns';
import styles from './History.module.css';

export default function StudentHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/attempts/my').then(r => setAttempts(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = attempts.filter(a => {
    const matchFilter = filter === 'all' || (filter === 'passed' && a.isPassed) || (filter === 'failed' && !a.isPassed);
    const matchSearch = !search || a.quiz?.title?.toLowerCase().includes(search.toLowerCase()) || a.quiz?.subject?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const passed = attempts.filter(a => a.isPassed).length;
  const avg = attempts.length ? (attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length).toFixed(1) : 0;
  const best = attempts.length ? Math.max(...attempts.map(a => a.percentage)).toFixed(0) : 0;

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className={styles.page}>
        {/* Summary */}
        <div className={styles.summaryRow}>
          {[
            { label:'Total Attempts', value:attempts.length, emoji:'📝', color:'#2563eb' },
            { label:'Passed', value:passed, emoji:'✅', color:'#10b981' },
            { label:'Failed', value:attempts.length-passed, emoji:'❌', color:'#ef4444' },
            { label:'Avg Score', value:`${avg}%`, emoji:'📊', color:'#7c3aed' },
            { label:'Best Score', value:`${best}%`, emoji:'🏆', color:'#d97706' },
          ].map(s => (
            <div key={s.label} className={styles.summaryCard} style={{'--c':s.color}}>
              <span>{s.emoji}</span>
              <div className={styles.sumVal} style={{color:s.color}}>{s.value}</div>
              <div className={styles.sumLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}><FiSearch className={styles.si}/><input placeholder="Search by title or subject..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <div className={styles.tabs}>
            {['all','passed','failed'].map(t => <button key={t} className={`${styles.tab} ${filter===t?styles.activeTab:''}`} onClick={()=>setFilter(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}><MdQuiz size={52} color="var(--gray-300)"/><h2>{attempts.length === 0 ? 'No attempts yet' : 'No results match'}</h2><p>{attempts.length === 0 ? 'Take your first quiz to see results here!' : 'Try a different filter.'}</p>{attempts.length===0 && <Link to="/student/quizzes" className={styles.browseBtn}>Browse Quizzes</Link>}</div>
        ) : (
          <div className={styles.list}>
            {filtered.map(a => (
              <div key={a._id} className={styles.card}>
                <div className={`${styles.scoreRing} ${a.isPassed?styles.ringPass:styles.ringFail}`}>
                  <span>{a.percentage?.toFixed(0)}%</span>
                </div>
                <div className={styles.cardMain}>
                  <h3 className={styles.cardTitle}>{a.quiz?.title || 'Deleted Quiz'}</h3>
                  <div className={styles.cardMeta}>
                    <span><FiBook size={12}/> {a.quiz?.subject||'—'}</span>
                    <span><FiClock size={12}/> {format(new Date(a.createdAt),'MMM d, yyyy · h:mm a')}</span>
                    <span>🎯 {a.obtainedMarks}/{a.totalMarks} marks</span>
                    {a.rank && <span>🏆 Rank #{a.rank}</span>}
                    {a.pointsEarned > 0 && <span>⭐ +{a.pointsEarned} XP</span>}
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <span className={`${styles.badge} ${a.isPassed?styles.pass:styles.fail}`}>{a.isPassed?'Passed':'Failed'}</span>
                  <Link to={`/student/result/${a._id}`} className={styles.detailBtn}>Details <FiArrowRight size={13}/></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
