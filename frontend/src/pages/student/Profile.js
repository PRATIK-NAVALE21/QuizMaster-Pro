import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiBook, FiHash, FiSave, FiLock, FiCheckCircle } from 'react-icons/fi';
import styles from './Profile.module.css';

const BADGE_META = { first_quiz:{label:'First Quiz',emoji:'🎯'}, quiz_10:{label:'Enthusiast',emoji:'📚'}, perfect_score:{label:'Perfect Score',emoji:'💯'}, streak_3:{label:'3-Day Streak',emoji:'🔥'}, streak_7:{label:'Week Warrior',emoji:'⚡'} };

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name:user?.name||'', department:user?.department||'', studentId:user?.studentId||'' });
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const set = k => e => setForm({...form, [k]:e.target.value});

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try { const r = await api.put('/auth/profile', form); updateUser(r.data.user); toast.success('Profile updated!'); }
    catch(err) { toast.error(err.response?.data?.message||'Update failed'); }
    finally { setSaving(false); }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) return toast.error('Passwords do not match');
    setChangingPwd(true);
    try { await api.put('/auth/change-password', { currentPassword:pwd.currentPassword, newPassword:pwd.newPassword }); toast.success('Password changed!'); setPwd({currentPassword:'',newPassword:'',confirmPassword:''}); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setChangingPwd(false); }
  };

  return (
    <Layout>
      <div className={styles.page}>
        {/* Profile hero */}
        <div className={styles.hero}>
          <div className={styles.heroAvatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div className={styles.heroInfo}>
            <h1>{user?.name}</h1>
            <p>{user?.email} · <span className={styles.roleBadge}>🎓 Student</span></p>
            <div className={styles.heroStats}>
              <span>⭐ {user?.totalPoints||0} XP</span>
              <span>🏅 Level {user?.level||1}</span>
              <span>🔥 {user?.streak||0} day streak</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        {user?.badges?.length > 0 && (
          <div className={styles.badgesCard}>
            <h2>🏆 Your Badges</h2>
            <div className={styles.badgesGrid}>
              {user.badges.map(b => (
                <div key={b} className={styles.badgeItem}>
                  <span className={styles.badgeEmoji}>{BADGE_META[b]?.emoji||'🏅'}</span>
                  <span className={styles.badgeLabel}>{BADGE_META[b]?.label||b}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.grid2}>
          <div className={styles.card}>
            <h2><FiUser size={16}/> Edit Profile</h2>
            <form onSubmit={saveProfile} className={styles.form}>
              {[
                { label:'Full Name', key:'name', icon:FiUser, placeholder:'Your full name' },
                { label:'Department', key:'department', icon:FiBook, placeholder:'e.g. Computer Science' },
                { label:'Student ID', key:'studentId', icon:FiHash, placeholder:'e.g. STU2024001' },
              ].map(f => (
                <div key={f.key} className={styles.field}>
                  <label>{f.label}</label>
                  <div className={styles.inputWrap}><f.icon className={styles.inputIcon} size={15}/><input value={form[f.key]} onChange={set(f.key)} placeholder={f.placeholder}/></div>
                </div>
              ))}
              <div className={styles.field}>
                <label>Email (read-only)</label>
                <div className={styles.inputWrap}><FiMail className={styles.inputIcon} size={15}/><input value={user?.email} disabled/></div>
              </div>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? <span className={styles.spin}/> : <><FiSave size={15}/> Save Changes</>}
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h2><FiLock size={16}/> Change Password</h2>
            <form onSubmit={changePwd} className={styles.form}>
              {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm Password']].map(([k,l]) => (
                <div key={k} className={styles.field}>
                  <label>{l}</label>
                  <div className={styles.inputWrap}><FiLock className={styles.inputIcon} size={15}/><input type="password" value={pwd[k]} onChange={e=>setPwd({...pwd,[k]:e.target.value})} placeholder={l} required/></div>
                </div>
              ))}
              <button type="submit" className={`${styles.saveBtn} ${styles.saveBtnGreen}`} disabled={changingPwd}>
                {changingPwd ? <span className={styles.spin}/> : <><FiCheckCircle size={15}/> Update Password</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
