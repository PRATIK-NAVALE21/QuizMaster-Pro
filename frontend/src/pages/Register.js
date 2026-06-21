import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MdQuiz } from 'react-icons/md';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiHash, FiBook } from 'react-icons/fi';
import styles from './Auth.module.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'student', department:'', studentId:'' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'student' || role === 'faculty') setForm(f => ({ ...f, role }));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Account created! Welcome, ${user.name.split(' ')[0]}! 🎉`);
      navigate(user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgBlob1}/><div className={styles.bgBlob2}/>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <Link to="/" className={styles.logo}><div className={styles.logoIcon}><MdQuiz size={22}/></div><span>QuizMaster Pro</span></Link>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Join thousands of students and educators on QuizMaster Pro</p>

        <div className={styles.roleToggle}>
          <button type="button" className={`${styles.roleBtn} ${form.role==='student'?styles.roleActive:''}`} onClick={() => setForm({...form, role:'student'})}>🎓 I'm a Student</button>
          <button type="button" className={`${styles.roleBtn} ${form.role==='faculty'?styles.roleActive:''}`} onClick={() => setForm({...form, role:'faculty'})}>👨‍🏫 I'm a Faculty</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Full Name *</label>
              <div className={styles.inputWrap}><FiUser className={styles.inputIcon}/>
                <input type="text" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required/>
              </div>
            </div>
            <div className={styles.field}>
              <label>Email Address *</label>
              <div className={styles.inputWrap}><FiMail className={styles.inputIcon}/>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required/>
              </div>
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Department</label>
              <div className={styles.inputWrap}><FiBook className={styles.inputIcon}/>
                <input type="text" placeholder="e.g. Computer Science" value={form.department} onChange={e => setForm({...form, department:e.target.value})}/>
              </div>
            </div>
            {form.role === 'student' && (
              <div className={styles.field}>
                <label>Student ID</label>
                <div className={styles.inputWrap}><FiHash className={styles.inputIcon}/>
                  <input type="text" placeholder="e.g. STU2024001" value={form.studentId} onChange={e => setForm({...form, studentId:e.target.value})}/>
                </div>
              </div>
            )}
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label>Password *</label>
              <div className={styles.inputWrap}><FiLock className={styles.inputIcon}/>
                <input type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm({...form, password:e.target.value})} required/>
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(!showPwd)}>{showPwd ? <FiEyeOff size={16}/> : <FiEye size={16}/>}</button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Confirm Password *</label>
              <div className={styles.inputWrap}><FiLock className={styles.inputIcon}/>
                <input type={showPwd ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword:e.target.value})} required/>
              </div>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.btnSpinner}/> : <><span>Create Account</span><FiArrowRight size={16}/></>}
          </button>
        </form>
        <p className={styles.switchText}>Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
