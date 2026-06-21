import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiSearch, FiAward } from 'react-icons/fi';
import { MdLeaderboard } from 'react-icons/md';
import styles from './Leaderboard.module.css';

const MEDAL = ['🥇','🥈','🥉'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/leaderboard/global').then(r => { setData(r.data.data); setMyRank(r.data.myRank); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.department?.toLowerCase().includes(search.toLowerCase()));
  const me = data.find(u => u._id === user?._id);

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.hero}>
          <MdLeaderboard size={36} color="white"/>
          <div>
            <h1>Global Leaderboard</h1>
            <p>Top performers across all quizzes — keep pushing to climb the ranks!</p>
          </div>
          {myRank && <div className={styles.myRankCard}><span>Your Rank</span><strong>#{myRank}</strong></div>}
        </div>

        {me && (
          <div className={styles.myCard}>
            <div className={styles.myRankBig}>#{myRank}</div>
            <div className={styles.myAvatar}>{me.name?.charAt(0)}</div>
            <div className={styles.myInfo}>
              <div className={styles.myName}>{me.name} <span className={styles.youTag}>You</span></div>
              <div className={styles.myDept}>{me.department || 'No department'}</div>
            </div>
            <div className={styles.myStats}>
              <div><strong>⭐ {me.totalPoints||0}</strong><small>XP</small></div>
              <div><strong>Lv.{me.level||1}</strong><small>Level</small></div>
              <div><strong>🔥 {me.streak||0}</strong><small>Streak</small></div>
            </div>
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.searchWrap}><FiSearch className={styles.searchIcon}/><input placeholder="Search by name or department..." value={search} onChange={e => setSearch(e.target.value)}/></div>
        </div>

        {loading ? <div className={styles.center}><div className="spinner"/></div> : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Rank</span><span>Student</span><span>Department</span><span>Level</span><span>XP</span><span>Streak</span><span>Badges</span>
            </div>
            {filtered.map((u, i) => {
              const rank = data.indexOf(u) + 1;
              const isMe = u._id === user?._id;
              return (
                <div key={u._id} className={`${styles.tableRow} ${isMe ? styles.myRow : ''} ${rank <= 3 ? styles.topRow : ''}`}>
                  <span className={styles.rankCell}>
                    {rank <= 3 ? <span className={styles.medal}>{MEDAL[rank-1]}</span> : <span className={styles.rankNum}>{rank}</span>}
                  </span>
                  <span className={styles.userCell}>
                    <div className={styles.avatar} style={{background: rank===1?'linear-gradient(135deg,#f59e0b,#fbbf24)': rank===2?'linear-gradient(135deg,#94a3b8,#cbd5e1)': rank===3?'linear-gradient(135deg,#b45309,#d97706)':'linear-gradient(135deg,var(--primary),#0ea5e9)'}}>
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <div className={styles.userName}>{u.name} {isMe && <span className={styles.youTag}>You</span>}</div>
                      <div className={styles.studentId}>{u.studentId || ''}</div>
                    </div>
                  </span>
                  <span className={styles.dept}>{u.department || '—'}</span>
                  <span className={styles.levelCell}><div className={styles.levelPill}>Lv.{u.level||1}</div></span>
                  <span className={styles.xpCell}><FiAward size={13} color="var(--warning)"/> {u.totalPoints||0}</span>
                  <span className={styles.streakCell}>🔥 {u.streak||0}</span>
                  <span className={styles.badgesCell}>{(u.badges||[]).slice(0,3).map(b => <span key={b} className={styles.badgeEmoji}>{b==='perfect_score'?'💯':b==='streak_7'?'⚡':b==='streak_3'?'🔥':b==='quiz_10'?'📚':'🎯'}</span>)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
