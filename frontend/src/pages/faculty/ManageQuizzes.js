import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlusCircle, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiBarChart2, FiSearch, FiClock, FiUsers, FiLock } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import styles from './ManageQuizzes.module.css';

const DIFF = { easy:{color:'#15803d',bg:'#dcfce7'}, medium:{color:'#854d0e',bg:'#fef9c3'}, hard:{color:'#dc2626',bg:'#fee2e2'} };

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/quizzes', { params: { limit:100 } }).then(r => setQuizzes(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const deleteQuiz = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This removes all questions and results permanently.`)) return;
    try { await api.delete(`/quizzes/${id}`); setQuizzes(q => q.filter(x => x._id !== id)); toast.success('Quiz deleted'); }
    catch(err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const togglePublish = async (id) => {
    try {
      const res = await api.patch(`/quizzes/${id}/publish`);
      setQuizzes(q => q.map(x => x._id === id ? {...x, isPublished: res.data.data.isPublished} : x));
      toast.success(res.data.message);
    } catch(err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filtered = quizzes.filter(q => {
    const ms = filter === 'all' || (filter === 'published' && q.isPublished) || (filter === 'draft' && !q.isPublished);
    const mt = !search || q.title?.toLowerCase().includes(search.toLowerCase()) || q.subject?.toLowerCase().includes(search.toLowerCase());
    return ms && mt;
  });

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div><h1>My Quizzes</h1><p>{quizzes.length} total · {quizzes.filter(q=>q.isPublished).length} published</p></div>
          <Link to="/faculty/quiz/create" className={styles.createBtn}><FiPlusCircle size={16}/> Create Quiz</Link>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}><FiSearch className={styles.si}/><input placeholder="Search quizzes..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <div className={styles.tabs}>
            {[['all','All'],['published','Published'],['draft','Drafts']].map(([v,l]) => <button key={v} className={`${styles.tab} ${filter===v?styles.active:''}`} onClick={()=>setFilter(v)}>{l}</button>)}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}><MdQuiz size={56} color="var(--gray-300)"/><h2>{quizzes.length===0?'No quizzes yet':'No results'}</h2><p>{quizzes.length===0?'Create your first quiz to get started!':'Try adjusting your search.'}</p>{quizzes.length===0&&<Link to="/faculty/quiz/create" className={styles.createBtn}><FiPlusCircle size={15}/> Create Quiz</Link>}</div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(quiz => {
              const dc = DIFF[quiz.difficulty]||DIFF.medium;
              return (
                <div key={quiz._id} className={styles.card}>
                  <div className={styles.cardBadges}>
                    <span className={styles.subjectBadge}>{quiz.subject}</span>
                    <span className={styles.diffBadge} style={{color:dc.color,background:dc.bg}}>{quiz.difficulty}</span>
                    {quiz.accessCode && <FiLock size={12} color="var(--gray-400)" title="Access code required"/>}
                    <span className={`${styles.pubBadge} ${quiz.isPublished?styles.pubOn:styles.pubOff}`}>{quiz.isPublished?'🟢 Published':'⚪ Draft'}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{quiz.title}</h3>
                  {quiz.description && <p className={styles.cardDesc}>{quiz.description}</p>}
                  <div className={styles.cardMeta}>
                    <span><MdQuiz size={13}/> {quiz.questions?.length||0} Q's</span>
                    <span><FiClock size={13}/> {quiz.duration}m</span>
                    <span><FiUsers size={13}/> {quiz.attemptCount||0} attempts</span>
                    <span><FiBarChart2 size={13}/> {parseFloat(quiz.averageScore||0).toFixed(0)}% avg</span>
                  </div>
                  <div className={styles.actions}>
                    <Link to={`/faculty/quiz/${quiz._id}/edit`} className={styles.actionBtn} title="Edit Questions"><FiEdit2 size={14}/> Edit</Link>
                    <Link to={`/faculty/quiz/${quiz._id}/results`} className={styles.actionBtn} title="View Results"><FiBarChart2 size={14}/> Results</Link>
                    <button onClick={() => togglePublish(quiz._id)} className={`${styles.actionBtn} ${quiz.isPublished?styles.unpublishBtn:styles.publishBtn}`}>
                      {quiz.isPublished ? <><FiToggleRight size={14}/> Unpublish</> : <><FiToggleLeft size={14}/> Publish</>}
                    </button>
                    <button onClick={() => deleteQuiz(quiz._id, quiz.title)} className={`${styles.actionBtn} ${styles.deleteBtn}`}><FiTrash2 size={14}/></button>
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
