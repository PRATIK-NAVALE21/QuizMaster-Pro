import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiBook, FiTrendingUp, FiAward, FiArrowRight, FiClock, FiZap, FiTarget } from 'react-icons/fi';
import { MdQuiz, MdLeaderboard } from 'react-icons/md';
import { format } from 'date-fns';
import styles from './Dashboard.module.css';

const BADGE_META = { first_quiz:{label:'First Quiz',emoji:'🎯'}, quiz_10:{label:'Enthusiast',emoji:'📚'}, perfect_score:{label:'Perfect Score',emoji:'💯'}, streak_3:{label:'3-Day Streak',emoji:'🔥'}, streak_7:{label:'Week Warrior',emoji:'⚡'} };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/student').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className={styles.center}><div className="spinner" /></div></Layout>;

  const stats = [
    { label:'Available Quizzes', value: data?.availableQuizzes||0, icon:MdQuiz, grad:'linear-gradient(135deg,#2563eb,#0ea5e9)', sub:'Ready to attempt' },
    { label:'Quizzes Taken',     value: data?.totalAttempts||0,   icon:FiBook, grad:'linear-gradient(135deg,#7c3aed,#a78bfa)', sub:'Total attempts' },
    { label:'Average Score',     value:`${data?.averageScore||0}%`, icon:FiTrendingUp, grad:'linear-gradient(135deg,#059669,#34d399)', sub:'Overall performance' },
    { label:'Passed',            value: data?.passCount||0,        icon:FiAward, grad:'linear-gradient(135deg,#d97706,#fbbf24)', sub:'Successful attempts' },
  ];

  return (
    <Layout>
      <div className={styles.page}>
        {/* Hero greeting */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroGreet}>Good day, <span>{user?.name?.split(' ')[0]}</span>! 👋</div>
            <p>You're on a <strong>{data?.streak||0}-day streak</strong>. Keep going!</p>
            <div className={styles.heroActions}>
              <Link to="/student/quizzes" className={styles.heroPrimary}><MdQuiz/> Browse Quizzes <FiArrowRight/></Link>
              <Link to="/student/leaderboard" className={styles.heroSecondary}><MdLeaderboard/> Leaderboard</Link>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.rankCard}>
              <div className={styles.rankNum}>#{data?.globalRank||'—'}</div>
              <div className={styles.rankLabel}>Global Rank</div>
            </div>
            <div className={styles.xpRing}>
              <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6"/><circle cx="40" cy="40" r="34" fill="none" stroke="white" strokeWidth="6" strokeDasharray={`${((data?.totalPoints||0)%100)*2.13} 213`} strokeLinecap="round" transform="rotate(-90 40 40)"/></svg>
              <div className={styles.xpInner}><span>{data?.totalPoints||0}</span><small>XP</small></div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{background:s.grad}}><s.icon size={20} color="white"/></div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statSub}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.grid2}>
          {/* Recent Activity */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2><FiClock size={16}/> Recent Activity</h2>
              <Link to="/student/history" className={styles.seeAll}>See all <FiArrowRight size={13}/></Link>
            </div>
            {!data?.recentAttempts?.length ? (
              <div className={styles.empty}><MdQuiz size={44} color="var(--gray-300)"/><p>No attempts yet. Take your first quiz!</p><Link to="/student/quizzes" className={styles.emptyBtn}>Browse Quizzes</Link></div>
            ) : (
              <div className={styles.actList}>
                {data.recentAttempts.map(a => (
                  <Link to={`/student/result/${a._id}`} key={a._id} className={styles.actRow}>
                    <div className={styles.actScore} style={{borderColor: a.isPassed?'#10b981':'#ef4444', color: a.isPassed?'#10b981':'#ef4444'}}>
                      {a.percentage?.toFixed(0)}%
                    </div>
                    <div className={styles.actInfo}>
                      <div className={styles.actTitle}>{a.quiz?.title}</div>
                      <div className={styles.actMeta}>{a.quiz?.subject} · {format(new Date(a.createdAt),'MMM d')}</div>
                    </div>
                    <span className={`${styles.badge} ${a.isPassed?styles.pass:styles.fail}`}>{a.isPassed?'Passed':'Failed'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Badges & Level */}
          <div className={styles.card}>
            <div className={styles.cardHead}><h2><FiAward size={16}/> Achievements</h2></div>
            <div className={styles.levelRow}>
              <div className={styles.levelInfo}>
                <div className={styles.levelNum}>Level {data?.level||1}</div>
                <div className={styles.levelSub}>{100-((data?.totalPoints||0)%100)} XP to next level</div>
              </div>
              <div className={styles.levelBar}><div className={styles.levelFill} style={{width:`${(data?.totalPoints||0)%100}%`}}/></div>
            </div>
            <div className={styles.statsRow2}>
              <div className={styles.mini}><FiTarget/><span>{data?.streak||0}</span><small>Day Streak</small></div>
              <div className={styles.mini}><FiZap/><span>{data?.totalPoints||0}</span><small>Total XP</small></div>
              <div className={styles.mini}><MdLeaderboard/><span>#{data?.globalRank||'—'}</span><small>Global Rank</small></div>
            </div>
            <div className={styles.badgesGrid}>
              {(data?.badges||[]).length===0 ? <p className={styles.noBadge}>Take quizzes to earn badges!</p> :
                (data?.badges||[]).map(b => (
                  <div key={b} className={styles.badgeCard}>
                    <span>{BADGE_META[b]?.emoji||'🏅'}</span>
                    <small>{BADGE_META[b]?.label||b}</small>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
