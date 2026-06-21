import React from 'react';
import { Link } from 'react-router-dom';
import { MdQuiz } from 'react-icons/md';
import { FiArrowRight, FiCheck, FiZap, FiShield, FiTrendingUp, FiUsers, FiAward, FiUpload } from 'react-icons/fi';
import styles from './Landing.module.css';

const FEATURES = [
  { icon:'🤖', title:'Gemini AI Generation', desc:'Generate exam-ready MCQs instantly from any topic using Google Gemini AI. Create 20 questions in seconds.' },
  { icon:'📊', title:'Excel / CSV Import', desc:'Bulk-upload hundreds of questions via spreadsheet. Download our template and import with one click.' },
  { icon:'🛡️', title:'Anti-Cheat Engine', desc:'Tab-switch detection, copy-paste blocking, warning system, and automatic disqualification.' },
  { icon:'🏆', title:'Leaderboard & XP', desc:'Gamified learning with XP points, levels, badges, daily streaks, and global leaderboards.' },
  { icon:'📈', title:'Deep Analytics', desc:'Per-question accuracy, score distributions, time-series trends, and student performance reports.' },
  { icon:'📜', title:'Instant Certificates', desc:'Auto-issue verifiable digital certificates when students pass with a qualifying score.' },
  { icon:'🔔', title:'Smart Notifications', desc:'Real-time alerts for quiz results, badge achievements, and quiz publications.' },
  { icon:'⏱️', title:'Timed Secure Exams', desc:'Configurable timers with auto-submit, question shuffle, and access-code-protected quizzes.' },
];

export default function Landing() {
  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}><div className={styles.navLogoIcon}><MdQuiz size={20}/></div><span>QuizMaster Pro</span></div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#roles" className={styles.navLink}>How it works</a>
        </div>
        <div className={styles.navActions}>
          <Link to="/login" className={styles.navLoginBtn}>Sign In</Link>
          <Link to="/register" className={styles.navRegisterBtn}>Get Started <FiArrowRight size={14}/></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}><FiZap size={13}/> Powered by Gemini AI</div>
          <h1 className={styles.heroTitle}>The <span className={styles.heroGrad}>Industry-Grade</span><br/>Quiz Platform</h1>
          <p className={styles.heroDesc}>Create AI-generated quizzes, run secure anti-cheat exams, track performance with deep analytics, and reward students with certificates and XP badges — all in one platform.</p>
          <div className={styles.heroCtas}>
            <Link to="/register?role=student" className={styles.ctaPrimary}>Start as Student <FiArrowRight/></Link>
            <Link to="/register?role=faculty" className={styles.ctaOutline}>Join as Faculty</Link>
          </div>
          <div className={styles.heroTrust}>
            <span><FiCheck size={13} color="#10b981"/> Free to use</span>
            <span><FiCheck size={13} color="#10b981"/> No credit card</span>
            <span><FiCheck size={13} color="#10b981"/> Deploy anywhere</span>
          </div>
        </div>

        {/* Floating UI preview */}
        <div className={styles.heroVisual}>
          <div className={styles.floatCard}>
            <div className={styles.fcDots}><span/><span/><span/></div>
            <div className={styles.fcQuestion}>What is the time complexity of QuickSort?</div>
            <div className={styles.fcOptions}>
              {['O(n²)', 'O(n log n)', 'O(log n)', 'O(n)'].map((o,i) => (
                <div key={i} className={`${styles.fcOpt} ${i===1?styles.fcOptCorrect:''}`}>
                  <span className={styles.fcLetter}>{String.fromCharCode(65+i)}</span>{o}
                  {i===1 && <FiCheck className={styles.fcCheck} color="#10b981"/>}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.floatBadge1}><FiZap size={12} color="#f59e0b"/> AI Generated</div>
          <div className={styles.floatBadge2}>🏆 Rank #3</div>
          <div className={styles.floatBadge3}>📜 Certificate Earned!</div>
        </div>
      </section>

      {/* Stats bar */}
      <div className={styles.statsBar}>
        {[['🤖','AI-Powered','Questions'],['🛡️','Anti-Cheat','Protection'],['📊','Real-time','Analytics'],['📜','Digital','Certificates'],['🏆','Live','Leaderboards']].map(([e,v,l]) => (
          <div key={l} className={styles.statItem}><span className={styles.statEmoji}>{e}</span><div><strong>{v}</strong><small>{l}</small></div></div>
        ))}
      </div>

      {/* Features */}
      <section className={styles.features} id="features">
        <div className={styles.sectionLabel}>Everything you need</div>
        <h2 className={styles.sectionTitle}>Features that set us apart</h2>
        <p className={styles.sectionDesc}>Built for modern institutions with security, analytics, and engagement at the core.</p>
        <div className={styles.featGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featCard}>
              <div className={styles.featIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className={styles.roles} id="roles">
        <div className={styles.sectionLabel}>Two roles</div>
        <h2 className={styles.sectionTitle}>Built for both sides of learning</h2>
        <div className={styles.rolesGrid}>
          <div className={styles.roleCard}>
            <div className={styles.roleHero} style={{background:'linear-gradient(135deg,#1e3a8a,#2563eb)'}}>
              <span className={styles.roleEmoji}>👨‍🏫</span>
              <h3>Faculty</h3>
            </div>
            <ul className={styles.roleList}>
              {['Create quizzes with full settings','Generate questions with Gemini AI','Import via Excel or CSV','Anti-cheat configuration','View per-question analytics','Export results as CSV','Issue digital certificates'].map(i => (
                <li key={i}><FiCheck size={14} color="#10b981"/>{i}</li>
              ))}
            </ul>
            <Link to="/register?role=faculty" className={styles.roleBtn}>Join as Faculty <FiArrowRight size={14}/></Link>
          </div>
          <div className={styles.roleCard}>
            <div className={styles.roleHero} style={{background:'linear-gradient(135deg,#064e3b,#059669)'}}>
              <span className={styles.roleEmoji}>🎓</span>
              <h3>Student</h3>
            </div>
            <ul className={styles.roleList}>
              {['Browse and take published quizzes','Secure timed exam environment','Real-time question navigator','Flag questions to revisit','Detailed answer review','Earn XP, badges & certificates','Compete on leaderboards'].map(i => (
                <li key={i}><FiCheck size={14} color="#10b981"/>{i}</li>
              ))}
            </ul>
            <Link to="/register?role=student" className={styles.roleBtn}>Join as Student <FiArrowRight size={14}/></Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2>Ready to transform how you quiz?</h2>
        <p>Get started in minutes — no setup required.</p>
        <Link to="/register" className={styles.ctaPrimary}>Create Free Account <FiArrowRight/></Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.navLogo}><div className={styles.navLogoIcon}><MdQuiz size={16}/></div><span>QuizMaster Pro</span></div>
        <p>© 2024 QuizMaster Pro · MERN Stack + Google Gemini AI</p>
        <Link to="/verify-certificate/demo" className={styles.footerLink}>Verify Certificate</Link>
      </footer>
    </div>
  );
}
