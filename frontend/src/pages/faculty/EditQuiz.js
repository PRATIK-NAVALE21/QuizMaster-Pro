import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiZap, FiUpload, FiDownload, FiSave, FiCheckCircle, FiX, FiFlag, FiArrowLeft } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import styles from './EditQuiz.module.css';

const blankQ = () => ({
  text:'', type:'mcq', difficulty:'medium', marks:1, negativeMark:0, explanation:'', hint:'',
  options:[{text:'',isCorrect:true},{text:'',isCorrect:false},{text:'',isCorrect:false},{text:'',isCorrect:false}]
});

export default function EditQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manual');
  const [saving, setSaving] = useState(false);
  const [manualQ, setManualQ] = useState(blankQ());
  const [editingId, setEditingId] = useState(null);
  const [aiForm, setAiForm] = useState({ topic:'', count:5, difficulty:'medium', additionalContext:'' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedQs, setParsedQs] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/quizzes/${id}`), api.get(`/questions/quiz/${id}`)])
      .then(([qr, qsr]) => { setQuiz(qr.data.data); setQuestions(qsr.data.data); })
      .catch(() => { toast.error('Quiz not found'); navigate('/faculty/quizzes'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const setOpt = (idx, field, val) => {
    const opts = [...manualQ.options];
    if (field === 'isCorrect') opts.forEach((o, i) => o.isCorrect = i === idx);
    else opts[idx] = { ...opts[idx], [field]: val };
    setManualQ({ ...manualQ, options: opts });
  };

  const saveManual = async () => {
    if (!manualQ.text.trim()) return toast.error('Question text is required');
    if (manualQ.options.filter(o => o.text.trim()).length < 2) return toast.error('At least 2 options required');
    if (!manualQ.options.some(o => o.isCorrect)) return toast.error('Select a correct answer');
    setSaving(true);
    try {
      if (editingId) {
        const r = await api.put(`/questions/${editingId}`, manualQ);
        setQuestions(qs => qs.map(q => q._id === editingId ? r.data.data : q));
        toast.success('Question updated'); setEditingId(null);
      } else {
        const r = await api.post('/questions', { ...manualQ, quizId: id });
        setQuestions(qs => [...qs, r.data.data]);
        toast.success('Question added');
      }
      setManualQ(blankQ());
    } catch(err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const editQ = (q) => {
    setManualQ({ text:q.text, type:q.type, difficulty:q.difficulty, marks:q.marks, negativeMark:q.negativeMark, explanation:q.explanation||'', hint:q.hint||'',
      options: q.options.length >= 4 ? q.options : [...q.options, ...Array(4-q.options.length).fill({text:'',isCorrect:false})] });
    setEditingId(q._id); setActiveTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteQ = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try { await api.delete(`/questions/${qId}`); setQuestions(qs => qs.filter(q => q._id !== qId)); toast.success('Deleted'); }
    catch(err) { toast.error('Delete failed'); }
  };

  const generateAI = async () => {
    if (!aiForm.topic.trim()) return toast.error('Enter a topic');
    setAiLoading(true); setAiQuestions([]);
    try {
      const r = await api.post('/ai/generate', { ...aiForm, subject: quiz?.subject });
      setAiQuestions(r.data.data);
      toast.success(`${r.data.data.length} questions generated!`);
    } catch(err) { toast.error(err.response?.data?.message || 'AI generation failed'); }
    finally { setAiLoading(false); }
  };

  const addAiQ = async (q) => {
    setSaving(true);
    try { const r = await api.post('/questions', { ...q, quizId: id }); setQuestions(qs => [...qs, r.data.data]); setAiQuestions(aqs => aqs.filter(x => x !== q)); toast.success('Added'); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const addAllAI = async () => {
    if (!aiQuestions.length) return;
    setSaving(true);
    try { const r = await api.post('/questions/bulk', { quizId: id, questions: aiQuestions }); setQuestions(qs => [...qs, ...r.data.data]); setAiQuestions([]); toast.success(`${r.data.data.length} questions added!`); }
    catch { toast.error('Bulk add failed'); } finally { setSaving(false); }
  };

  const parseFile = async () => {
    if (!uploadFile) return toast.error('Select a file first');
    setUploading(true); setParsedQs([]); setUploadErrors([]);
    const fd = new FormData(); fd.append('file', uploadFile);
    try { const r = await api.post('/upload/questions', fd, { headers:{'Content-Type':'multipart/form-data'} }); setParsedQs(r.data.data); setUploadErrors(r.data.errors||[]); toast.success(`${r.data.data.length} questions parsed!`); }
    catch(err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const addParsed = async () => {
    if (!parsedQs.length) return;
    setSaving(true);
    try { const r = await api.post('/questions/bulk', { quizId: id, questions: parsedQs }); setQuestions(qs => [...qs, ...r.data.data]); setParsedQs([]); setUploadFile(null); toast.success(`${r.data.data.length} questions added!`); }
    catch { toast.error('Import failed'); } finally { setSaving(false); }
  };

  const togglePublish = async () => {
    try { const r = await api.patch(`/quizzes/${id}/publish`); setQuiz(q => ({...q, isPublished:r.data.data.isPublished})); toast.success(r.data.message); }
    catch(err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  const DIFF_COLOR = { easy:'#15803d', medium:'#854d0e', hard:'#dc2626' };

  return (
    <Layout>
      <div className={styles.page}>
        {/* Quiz bar */}
        <div className={styles.quizBar}>
          <Link to="/faculty/quizzes" className={styles.backLink}><FiArrowLeft size={14}/></Link>
          <div className={styles.quizBarInfo}>
            <h1>{quiz?.title}</h1>
            <span>{quiz?.subject} · <strong>{questions.length}</strong> questions · <strong>{quiz?.totalMarks}</strong> marks</span>
          </div>
          <div className={styles.quizBarActions}>
            <Link to={`/faculty/quiz/${id}/results`} className={styles.resultsBtn}>📊 Results</Link>
            <button onClick={togglePublish} className={`${styles.publishBtn} ${quiz?.isPublished?styles.pubOn:styles.pubOff}`}>
              {quiz?.isPublished ? '⚪ Unpublish' : '🟢 Publish'}
            </button>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Left panel — Add questions */}
          <div className={styles.addPanel}>
            <div className={styles.tabs}>
              {[{k:'manual',l:'✏️ Manual'},{k:'ai',l:'🤖 AI Generate'},{k:'upload',l:'📊 Excel/CSV'}].map(t => (
                <button key={t.k} className={`${styles.tab} ${activeTab===t.k?styles.activeTab:''}`} onClick={()=>setActiveTab(t.k)}>{t.l}</button>
              ))}
            </div>

            <div className={styles.tabBody}>
              {/* MANUAL */}
              {activeTab === 'manual' && (
                <div className={styles.manualForm}>
                  {editingId && (
                    <div className={styles.editBanner}><FiEdit2 size={13}/> Editing question <button onClick={()=>{setManualQ(blankQ());setEditingId(null);}} className={styles.cancelEdit}><FiX size={13}/> Cancel</button></div>
                  )}
                  <div className={styles.field}>
                    <label>Question Text *</label>
                    <textarea value={manualQ.text} onChange={e=>setManualQ({...manualQ,text:e.target.value})} placeholder="Enter your question here..." rows={3}/>
                  </div>
                  <div className={styles.row3}>
                    <div className={styles.field}>
                      <label>Difficulty</label>
                      <select value={manualQ.difficulty} onChange={e=>setManualQ({...manualQ,difficulty:e.target.value})}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className={styles.field}><label>Marks</label><input type="number" min={0.5} step={0.5} value={manualQ.marks} onChange={e=>setManualQ({...manualQ,marks:parseFloat(e.target.value)||1})}/></div>
                    <div className={styles.field}><label>Negative Mark</label><input type="number" min={0} step={0.5} value={manualQ.negativeMark} onChange={e=>setManualQ({...manualQ,negativeMark:parseFloat(e.target.value)||0})}/></div>
                  </div>
                  <div className={styles.field}><label>Options <small>(select correct answer)</small></label>
                    {manualQ.options.map((opt, i) => (
                      <div key={i} className={`${styles.optRow} ${opt.isCorrect?styles.optCorrect:''}`}>
                        <input type="radio" name="correct" checked={opt.isCorrect} onChange={()=>setOpt(i,'isCorrect',true)} className={styles.radio}/>
                        <span className={styles.optLetter}>{String.fromCharCode(65+i)}</span>
                        <input type="text" value={opt.text} onChange={e=>setOpt(i,'text',e.target.value)} placeholder={`Option ${String.fromCharCode(65+i)}`} className={styles.optInput}/>
                        {opt.isCorrect && <FiCheckCircle size={15} color="#10b981"/>}
                      </div>
                    ))}
                  </div>
                  <div className={styles.field}><label>Hint (optional)</label><input type="text" value={manualQ.hint} onChange={e=>setManualQ({...manualQ,hint:e.target.value})} placeholder="Optional hint for students"/></div>
                  <div className={styles.field}><label>Explanation (optional)</label><textarea value={manualQ.explanation} onChange={e=>setManualQ({...manualQ,explanation:e.target.value})} placeholder="Explanation shown after submission..." rows={2}/></div>
                  <button onClick={saveManual} className={styles.addBtn} disabled={saving}>
                    {saving?<span className={styles.spin}/>:editingId?<><FiSave size={14}/> Update Question</>:<><FiPlus size={14}/> Add Question</>}
                  </button>
                </div>
              )}

              {/* AI */}
              {activeTab === 'ai' && (
                <div className={styles.aiForm}>
                  <div className={styles.aiBanner}>🤖 <strong>Gemini AI</strong> — Generate exam-ready MCQs instantly from any topic</div>
                  <div className={styles.field}><label>Topic *</label><input type="text" value={aiForm.topic} onChange={e=>setAiForm({...aiForm,topic:e.target.value})} placeholder="e.g. Binary Trees, French Revolution, Photosynthesis..."/></div>
                  <div className={styles.row2}>
                    <div className={styles.field}><label>Number of Questions</label>
                      <select value={aiForm.count} onChange={e=>setAiForm({...aiForm,count:parseInt(e.target.value)})}>
                        {[3,5,8,10,15,20].map(n=><option key={n} value={n}>{n} Questions</option>)}
                      </select>
                    </div>
                    <div className={styles.field}><label>Difficulty</label>
                      <select value={aiForm.difficulty} onChange={e=>setAiForm({...aiForm,difficulty:e.target.value})}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.field}><label>Additional Context</label><textarea value={aiForm.additionalContext} onChange={e=>setAiForm({...aiForm,additionalContext:e.target.value})} placeholder="Subtopics, context, level of detail..." rows={2}/></div>
                  <button onClick={generateAI} className={styles.aiBtn} disabled={aiLoading}>
                    {aiLoading?<><span className={styles.spin}/> Generating…</>:<><FiZap size={14}/> Generate with Gemini AI</>}
                  </button>
                  {aiQuestions.length > 0 && (
                    <div className={styles.aiResults}>
                      <div className={styles.aiResultsHead}>
                        <span>{aiQuestions.length} questions ready</span>
                        <button onClick={addAllAI} className={styles.addAllBtn} disabled={saving}><FiPlus size={13}/> Add All</button>
                      </div>
                      {aiQuestions.map((q, i) => (
                        <div key={i} className={styles.aiCard}>
                          <div className={styles.aiCardHead}>
                            <span className={styles.aiQNum}>Q{i+1}</span>
                            <span className={styles.aiDiff} style={{color:DIFF_COLOR[q.difficulty]||'#854d0e'}}>{q.difficulty}</span>
                            <button onClick={()=>addAiQ(q)} className={styles.addOneBtn} disabled={saving}><FiPlus size={12}/> Add</button>
                          </div>
                          <p className={styles.aiQText}>{q.text}</p>
                          <div className={styles.aiOpts}>
                            {q.options.map((o,j)=><div key={j} className={`${styles.aiOpt} ${o.isCorrect?styles.aiCorrect:''}`}>{String.fromCharCode(65+j)}. {o.text}{o.isCorrect?' ✅':''}</div>)}
                          </div>
                          {q.explanation && <div className={styles.aiExpl}>💡 {q.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* UPLOAD */}
              {activeTab === 'upload' && (
                <div className={styles.uploadForm}>
                  <div className={styles.uploadBanner}>📊 Import questions from Excel or CSV spreadsheet</div>
                  {/* <button onClick={()=>window.open('/api/upload/template','_blank')} className={styles.templateBtn}><FiDownload size={13}/> Download Template</button> */}
                   <button
  type="button"
  onClick={() =>
    window.open(
      'http://localhost:5000/api/upload/template',
      '_blank'
    )
  }
  className={styles.templateBtn}
>
  <FiDownload size={13}/>
  Download Template
</button>

                  <div className={styles.dropZone} onClick={()=>fileRef.current?.click()}
                    onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setUploadFile(f);}}>
                    <FiUpload size={28} color="var(--gray-300)"/>
                    <p>{uploadFile ? uploadFile.name : 'Click or drag & drop your file here'}</p>
                    <small>.xlsx · .xls · .csv (max 5MB)</small>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e=>setUploadFile(e.target.files[0])}/>
                  </div>
                  {uploadFile && <button onClick={parseFile} className={styles.parseBtn} disabled={uploading}>{uploading?<><span className={styles.spin}/> Parsing…</>:<><FiUpload size={13}/> Parse File</>}</button>}
                  {uploadErrors.length > 0 && <div className={styles.errorBox}>⚠️ {uploadErrors.length} warning(s):{uploadErrors.map((e,i)=><div key={i} className={styles.errRow}>· {e}</div>)}</div>}
                  {parsedQs.length > 0 && (
                    <div className={styles.parsedBox}>
                      <div className={styles.parsedHead}><span>✅ {parsedQs.length} questions ready</span><button onClick={addParsed} className={styles.addAllBtn} disabled={saving}><FiPlus size={13}/> Add All</button></div>
                      {parsedQs.slice(0,3).map((q,i)=>(
                        <div key={i} className={styles.parsedRow}><strong>Q{i+1}:</strong> {q.text}<div className={styles.parsedOpts}>{q.options.map((o,j)=><span key={j} className={o.isCorrect?styles.parsedCorrect:''}>{String.fromCharCode(65+j)}. {o.text}</span>)}</div></div>
                      ))}
                      {parsedQs.length>3&&<p className={styles.moreText}>…and {parsedQs.length-3} more</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel — Question list */}
          <div className={styles.qPanel}>
            <div className={styles.qPanelHead}>
              <h2>Questions ({questions.length})</h2>
              <span className={styles.totalMarks}>{quiz?.totalMarks} total marks</span>
            </div>
            {questions.length === 0 ? (
              <div className={styles.emptyQList}><MdQuiz size={40} color="var(--gray-300)"/><p>No questions yet. Use the panel on the left to add questions.</p></div>
            ) : (
              <div className={styles.qList}>
                {questions.map((q, i) => (
                  <div key={q._id} className={styles.qCard}>
                    <div className={styles.qCardTop}>
                      <span className={styles.qCardNum}>Q{i+1}</span>
                      <span className={styles.qDiff} style={{color:DIFF_COLOR[q.difficulty]||'#854d0e',background:DIFF_COLOR[q.difficulty]+'18'}}>{q.difficulty}</span>
                      {q.isAIGenerated && <span className={styles.aiBadge}>🤖 AI</span>}
                      <span className={styles.qMarks}>{q.marks}m</span>
                      {q.negativeMark > 0 && <span className={styles.negMark}>-{q.negativeMark}</span>}
                      <div className={styles.qCardActions}>
                        <button onClick={()=>editQ(q)} className={styles.editQBtn} title="Edit"><FiEdit2 size={12}/></button>
                        <button onClick={()=>deleteQ(q._id)} className={styles.delQBtn} title="Delete"><FiTrash2 size={12}/></button>
                      </div>
                    </div>
                    <p className={styles.qCardText}>{q.text}</p>
                    {expandedQ === q._id && (
                      <div className={styles.qExpanded}>
                        {q.options.map((o, j) => (
                          <div key={j} className={`${styles.qOpt} ${o.isCorrect?styles.qOptCorrect:''}`}>
                            <span>{String.fromCharCode(65+j)}</span> {o.text} {o.isCorrect && '✅'}
                          </div>
                        ))}
                        {q.explanation && <div className={styles.qExpl}>💡 {q.explanation}</div>}
                      </div>
                    )}
                    <button onClick={()=>setExpandedQ(expandedQ===q._id?null:q._id)} className={styles.expandBtn}>
                      {expandedQ===q._id?'▲ Hide options':'▼ Show options'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
