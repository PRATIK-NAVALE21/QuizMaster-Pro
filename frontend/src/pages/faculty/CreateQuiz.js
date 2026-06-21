import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiSave, FiArrowRight, FiClock, FiArrowLeft, FiInfo } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import styles from './CreateQuiz.module.css';

const DEFAULTS = {
  title:'', description:'', subject:'', category:'General', difficulty:'medium',
  duration:30, maxAttempts:1, passingMarks:0, shuffleQuestions:false, shuffleOptions:false,
  showResults:true, showAnswersAfter:true, instructions:'', tags:'',
  accessCode:'', certificateEnabled:false, certificateMinScore:80,
  leaderboardEnabled:true, feedbackEnabled:true, pointsOnPass:10,
  antiCheat:{ preventTabSwitch:true, preventCopyPaste:true, preventRightClick:true, fullscreenRequired:false, maxWarnings:3 }
};

const Toggle = ({ value, onChange, label, desc }) => (
  <label className={styles.toggle}>
    <div className={styles.toggleText}>
      <span>{label}</span>
      {desc && <small>{desc}</small>}
    </div>
    <div className={`${styles.toggleSwitch} ${value ? styles.on : ''}`} onClick={onChange}>
      <div className={styles.toggleKnob}/>
    </div>
  </label>
);

export default function CreateQuiz() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setAC = (k, v) => setForm(f => ({ ...f, antiCheat: { ...f.antiCheat, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Quiz title is required');
    if (!form.subject.trim()) return toast.error('Subject is required');
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
      const res = await api.post('/quizzes', payload);
      toast.success('Quiz created! Now add your questions.');
      navigate(`/faculty/quiz/${res.data.data._id}/edit`);
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to create quiz'); }
    finally { setSaving(false); }
  };

  const sections = [
    { id:'basic', label:'Basic Info' },
    { id:'settings', label:'Settings' },
    { id:'security', label:'Security' },
    { id:'advanced', label:'Advanced' },
  ];

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link to="/faculty/quizzes" className={styles.backBtn}><FiArrowLeft size={15}/> My Quizzes</Link>
          <h1 className={styles.pageTitle}><MdQuiz size={20}/> Create New Quiz</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section nav */}
          <div className={styles.sectionNav}>
            {sections.map(s => (
              <button key={s.id} type="button" className={`${styles.sectionBtn} ${activeSection===s.id?styles.sectionActive:''}`} onClick={() => setActiveSection(s.id)}>{s.label}</button>
            ))}
          </div>

          {/* Basic Info */}
          {activeSection === 'basic' && (
            <div className={styles.card}>
              <div className={styles.cardTitle}><FiInfo size={16}/> Basic Information</div>
              <div className={styles.grid2}>
                <div className={`${styles.field} ${styles.span2}`}>
                  <label>Quiz Title *</label>
                  <input type="text" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Data Structures Mid-Term Exam" required/>
                </div>
                <div className={styles.field}>
                  <label>Subject *</label>
                  <input type="text" value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="e.g. Computer Science" required/>
                </div>
                <div className={styles.field}>
                  <label>Category</label>
                  <input type="text" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="e.g. Mid-Term, Unit Test"/>
                </div>
                <div className={`${styles.field} ${styles.span2}`}>
                  <label>Description</label>
                  <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Brief description of this quiz..." rows={3}/>
                </div>
                <div className={`${styles.field} ${styles.span2}`}>
                  <label>Instructions for Students</label>
                  <textarea value={form.instructions} onChange={e=>set('instructions',e.target.value)} placeholder="Any special instructions shown before the quiz starts..." rows={2}/>
                </div>
                <div className={styles.field}>
                  <label>Tags (comma-separated)</label>
                  <input type="text" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="arrays, sorting, algorithms"/>
                </div>
                <div className={styles.field}>
                  <label>Difficulty</label>
                  <div className={styles.diffRow}>
                    {['easy','medium','hard'].map(d => (
                      <button key={d} type="button" className={`${styles.diffBtn} ${form.difficulty===d?styles[`diff_${d}`]:''}`} onClick={()=>set('difficulty',d)}>{d.charAt(0).toUpperCase()+d.slice(1)}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeSection === 'settings' && (
            <div className={styles.card}>
              <div className={styles.cardTitle}><FiClock size={16}/> Quiz Settings</div>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label>Duration (minutes)</label>
                  <input type="number" min={1} max={300} value={form.duration} onChange={e=>set('duration',parseInt(e.target.value)||30)}/>
                </div>
                <div className={styles.field}>
                  <label>Max Attempts</label>
                  <input type="number" min={1} max={10} value={form.maxAttempts} onChange={e=>set('maxAttempts',parseInt(e.target.value)||1)}/>
                </div>
                <div className={styles.field}>
                  <label>Passing Marks (0 = auto 50%)</label>
                  <input type="number" min={0} value={form.passingMarks} onChange={e=>set('passingMarks',parseInt(e.target.value)||0)}/>
                </div>
                <div className={styles.field}>
                  <label>XP Points on Pass</label>
                  <input type="number" min={0} max={1000} value={form.pointsOnPass} onChange={e=>set('pointsOnPass',parseInt(e.target.value)||10)}/>
                </div>
                <div className={styles.field}>
                  <label>Access Code (optional)</label>
                  <input type="text" value={form.accessCode} onChange={e=>set('accessCode',e.target.value)} placeholder="Leave empty for public access"/>
                </div>
              </div>
              <div className={styles.togglesGrid}>
                <Toggle value={form.shuffleQuestions} onChange={()=>set('shuffleQuestions',!form.shuffleQuestions)} label="Shuffle Questions" desc="Randomize question order for each student"/>
                <Toggle value={form.shuffleOptions} onChange={()=>set('shuffleOptions',!form.shuffleOptions)} label="Shuffle Options" desc="Randomize answer choice order"/>
                <Toggle value={form.showResults} onChange={()=>set('showResults',!form.showResults)} label="Show Results After Submission" desc="Students can see their score immediately"/>
                <Toggle value={form.showAnswersAfter} onChange={()=>set('showAnswersAfter',!form.showAnswersAfter)} label="Show Correct Answers" desc="Students can review correct answers in result"/>
                <Toggle value={form.leaderboardEnabled} onChange={()=>set('leaderboardEnabled',!form.leaderboardEnabled)} label="Enable Leaderboard" desc="Show this quiz on quiz-level leaderboard"/>
                <Toggle value={form.feedbackEnabled} onChange={()=>set('feedbackEnabled',!form.feedbackEnabled)} label="Enable Feedback" desc="Allow students to rate and comment on the quiz"/>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>🛡️ Anti-Cheat & Security</div>
              <div className={styles.acInfo}>These settings help maintain exam integrity. Violations log warnings; exceeding the limit disqualifies the student.</div>
              <div className={styles.grid3}>
                <div className={styles.field}>
                  <label>Max Warnings Before Disqualification</label>
                  <input type="number" min={1} max={20} value={form.antiCheat.maxWarnings} onChange={e=>setAC('maxWarnings',parseInt(e.target.value)||3)}/>
                </div>
              </div>
              <div className={styles.togglesGrid}>
                <Toggle value={form.antiCheat.preventTabSwitch} onChange={()=>setAC('preventTabSwitch',!form.antiCheat.preventTabSwitch)} label="Detect Tab Switching" desc="Log warning when student switches to another tab or window"/>
                <Toggle value={form.antiCheat.preventCopyPaste} onChange={()=>setAC('preventCopyPaste',!form.antiCheat.preventCopyPaste)} label="Block Copy & Paste" desc="Prevent copying question content"/>
                <Toggle value={form.antiCheat.preventRightClick} onChange={()=>setAC('preventRightClick',!form.antiCheat.preventRightClick)} label="Disable Right Click" desc="Prevent context menu during exam"/>
                <Toggle value={form.antiCheat.fullscreenRequired} onChange={()=>setAC('fullscreenRequired',!form.antiCheat.fullscreenRequired)} label="Require Fullscreen" desc="Student must stay in fullscreen mode"/>
              </div>
            </div>
          )}

          {/* Advanced */}
          {activeSection === 'advanced' && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>📜 Certificates & Advanced</div>
              <div className={styles.togglesGrid}>
                <Toggle value={form.certificateEnabled} onChange={()=>set('certificateEnabled',!form.certificateEnabled)} label="Issue Digital Certificates" desc="Auto-generate a verifiable certificate for qualifying students"/>
              </div>
              {form.certificateEnabled && (
                <div className={styles.field} style={{marginTop:16,maxWidth:300}}>
                  <label>Minimum Score for Certificate (%)</label>
                  <input type="number" min={1} max={100} value={form.certificateMinScore} onChange={e=>set('certificateMinScore',parseInt(e.target.value)||80)}/>
                </div>
              )}
            </div>
          )}

          {/* Footer nav */}
          <div className={styles.formFooter}>
            <div className={styles.sectionDots}>
              {sections.map(s => <div key={s.id} className={`${styles.dot} ${activeSection===s.id?styles.dotActive:''}`} onClick={()=>setActiveSection(s.id)}/>)}
            </div>
            <div className={styles.footerActions}>
              {sections.indexOf(sections.find(s=>s.id===activeSection)) > 0 && (
                <button type="button" className={styles.prevBtn} onClick={()=>{ const i=sections.findIndex(s=>s.id===activeSection); setActiveSection(sections[i-1].id); }}>← Previous</button>
              )}
              {activeSection !== 'advanced' ? (
                <button type="button" className={styles.nextBtn} onClick={()=>{ const i=sections.findIndex(s=>s.id===activeSection); setActiveSection(sections[i+1].id); }}>Next →</button>
              ) : (
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? <span className={styles.spin}/> : <><FiSave size={15}/> Create Quiz & Add Questions <FiArrowRight size={15}/></>}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
