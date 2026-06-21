import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiBook, FiUser, FiLogOut, FiMenu, FiX, FiPlusCircle, FiList, FiClock, FiBell, FiTrendingUp, FiAward, FiBarChart2, FiChevronRight } from 'react-icons/fi';
import { MdQuiz, MdLeaderboard } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import styles from './Layout.module.css';

const studentNav = [
  { to: '/student/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/student/quizzes', icon: MdQuiz, label: 'Browse Quizzes' },
  { to: '/student/history', icon: FiClock, label: 'My Results' },
  { to: '/student/analytics', icon: FiBarChart2, label: 'My Analytics' },
  { to: '/student/leaderboard', icon: MdLeaderboard, label: 'Leaderboard' },
  { to: '/student/profile', icon: FiUser, label: 'Profile' },
];

const facultyNav = [
  { to: '/faculty/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/faculty/quizzes', icon: FiList, label: 'My Quizzes' },
  { to: '/faculty/quiz/create', icon: FiPlusCircle, label: 'Create Quiz' },
  { to: '/faculty/analytics', icon: FiBarChart2, label: 'Analytics' },
  { to: '/faculty/profile', icon: FiUser, label: 'Profile' },
];

const BADGE_EMOJIS = { first_quiz:'🎯', quiz_10:'📚', perfect_score:'💯', streak_3:'🔥', streak_7:'⚡' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = user?.role === 'faculty' ? facultyNav : studentNav;

  useEffect(() => {
    api.get('/notifications').then(r => { setNotifications(r.data.data); setUnread(r.data.unread); }).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  const levelPct = user ? ((user.totalPoints || 0) % 100) : 0;

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}><MdQuiz size={22} /></div>
            <div><div className={styles.logoText}>QuizMaster</div><div className={styles.logoSub}>Pro v2</div></div>
          </div>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}><FiX /></button>
        </div>

        <div className={styles.userCard}>
          <div className={styles.userAvatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole}>{user?.role === 'faculty' ? '👨‍🏫 Faculty' : '🎓 Student'}</div>
          </div>
          {user?.role === 'student' && (
            <div className={styles.levelBadge}>Lv.{user?.level || 1}</div>
          )}
        </div>

        {user?.role === 'student' && (
          <div className={styles.xpBar}>
            <div className={styles.xpLabel}><span>⭐ {user?.totalPoints || 0} XP</span><span>{levelPct}/100 to next level</span></div>
            <div className={styles.xpTrack}><div className={styles.xpFill} style={{ width: `${levelPct}%` }} /></div>
          </div>
        )}

        <nav className={styles.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`${styles.navItem} ${location.pathname === to ? styles.active : ''}`} onClick={() => setSidebarOpen(false)}>
              <Icon size={19} />
              <span>{label}</span>
              {location.pathname === to && <FiChevronRight className={styles.navArrow} size={14} />}
            </Link>
          ))}
        </nav>

        {user?.role === 'student' && user?.badges?.length > 0 && (
          <div className={styles.badgesSection}>
            <div className={styles.badgesLabel}>Badges</div>
            <div className={styles.badgesList}>
              {user.badges.map(b => <span key={b} title={b} className={styles.badge}>{BADGE_EMOJIS[b] || '🏅'}</span>)}
            </div>
          </div>
        )}

        <button className={styles.logoutBtn} onClick={handleLogout}><FiLogOut size={17} /> Logout</button>
      </aside>

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}><FiMenu size={22} /></button>
          <div className={styles.headerTitle}>
            {navItems.find(n => location.pathname.startsWith(n.to))?.label || 'QuizMaster Pro'}
          </div>
          <div className={styles.headerRight}>
            {user?.role === 'student' && (
              <div className={styles.headerStats}>
                <span title="Streak">🔥 {user?.streak || 0}</span>
                <span title="Points">⭐ {user?.totalPoints || 0}</span>
              </div>
            )}
            <div className={styles.notifWrap}>
              <button className={styles.notifBtn} onClick={() => { setNotifOpen(o => !o); if (unread) markAllRead(); }}>
                <FiBell size={20} />
                {unread > 0 && <span className={styles.notifBadge}>{unread > 9 ? '9+' : unread}</span>}
              </button>
              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}><span>Notifications</span><button onClick={() => setNotifOpen(false)}><FiX size={14}/></button></div>
                  {notifications.length === 0 ? <div className={styles.notifEmpty}>No notifications</div> : (
                    <div className={styles.notifList}>
                      {notifications.slice(0, 8).map(n => (
                        <div key={n._id} className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}>
                          <span className={styles.notifIcon}>{n.icon || '🔔'}</span>
                          <div><div className={styles.notifTitle}>{n.title}</div><div className={styles.notifMsg}>{n.message}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link to={`/${user?.role}/profile`} className={styles.headerAvatar}>{user?.name?.charAt(0)?.toUpperCase()}</Link>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
