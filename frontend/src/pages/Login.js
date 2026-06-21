import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdQuiz } from 'react-icons/md';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      navigate(user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    if (role === 'student') setForm({ email: 'student@demo.com', password: 'demo123' });
    else setForm({ email: 'faculty@demo.com', password: 'demo123' });
    toast('Demo credentials filled!', { icon: '✏️' });
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgBlob1}/><div className={styles.bgBlob2}/>
      <div className={styles.card}>
        <Link to="/" className={styles.logo}><div className={styles.logoIcon}><MdQuiz size={22}/></div><span>QuizMaster Pro</span></Link>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to continue your learning journey</p>

        <div className={styles.demoBtns}>
          <button onClick={() => fillDemo('student')} className={styles.demoBtn} type="button">🎓 Student Demo</button>
          <button onClick={() => fillDemo('faculty')} className={styles.demoBtn} type="button">👨‍🏫 Faculty Demo</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email Address</label>
            <div className={styles.inputWrap}>
              <FiMail className={styles.inputIcon}/>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} autoComplete="email" required/>
            </div>
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.inputWrap}>
              <FiLock className={styles.inputIcon}/>
              <input type={showPwd ? 'text' : 'password'} placeholder="Your password" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} autoComplete="current-password" required/>
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <FiEyeOff size={16}/> : <FiEye size={16}/>}
              </button>
            </div>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.btnSpinner}/> : <><span>Sign In</span><FiArrowRight size={16}/></>}
          </button>
        </form>
        <p className={styles.switchText}>Don't have an account? <Link to="/register">Create one free</Link></p>
      </div>
    </div>
  );
}
