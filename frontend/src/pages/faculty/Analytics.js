import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { FiBarChart2, FiChevronDown } from 'react-icons/fi';
import styles from './Analytics.module.css';

export default function FacultyAnalytics() {
  const [quizzes, setQuizzes] = useState([]);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/quizzes', { params: { limit: 100 } }).then(r => {
      setQuizzes(r.data.data);
      if (r.data.data.length) setSelected(r.data.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/analytics/quiz/${selected}`).then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, [selected]);

  const PIE_COLORS = ['#10b981', '#ef4444'];

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1><FiBarChart2/> Deep Analytics</h1>
          <div className={styles.selectWrap}>
            <select value={selected} onChange={e => setSelected(e.target.value)} className={styles.select}>
              {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
            </select>
            <FiChevronDown className={styles.selectIcon}/>
          </div>
        </div>

        {loading && <div className={styles.center}><div className="spinner"/></div>}
        {!loading && data && (
          <>
            <div className={styles.kpiRow}>
              {[
                { label:'Total Attempts', value:data.summary.totalAttempts, emoji:'📝' },
                { label:'Pass Rate', value:`${data.summary.totalAttempts?((data.summary.passCount/data.summary.totalAttempts)*100).toFixed(0):0}%`, emoji:'✅' },
                { label:'Avg Score', value:`${data.summary.avgScore}%`, emoji:'📊' },
                { label:'Avg Time', value:`${data.summary.avgTime}m`, emoji:'⏱️' },
                { label:'Highest', value:`${data.summary.highestScore}%`, emoji:'🏆' },
                { label:'Lowest', value:`${data.summary.lowestScore}%`, emoji:'📉' },
              ].map(k => (
                <div key={k.label} className={styles.kpi}>
                  <span>{k.emoji}</span>
                  <div className={styles.kpiVal}>{k.value}</div>
                  <div className={styles.kpiLabel}>{k.label}</div>
                </div>
              ))}
            </div>

            <div className={styles.grid2}>
              <div className={styles.card}>
                <h2>Score Distribution</h2>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={data.scoreDistribution} margin={{top:4,right:8,left:-20,bottom:4}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="range" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                    <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                    <Bar dataKey="count" fill="url(#grad)" radius={[6,6,0,0]} name="Students"/>
                    <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb"/><stop offset="100%" stopColor="#0ea5e9"/></linearGradient></defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={styles.card}>
                <h2>Pass / Fail</h2>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={[{name:'Passed',value:data.summary.passCount},{name:'Failed',value:data.summary.totalAttempts-data.summary.passCount}]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {PIE_COLORS.map((c,i) => <Cell key={i} fill={c}/>)}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {data.timeSeries?.length > 0 && (
              <div className={styles.card}>
                <h2>Attempt Trend (Last 30 Days)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.timeSeries} margin={{top:4,right:8,left:-20,bottom:4}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="_id" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                    <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{r:3}} name="Attempts"/>
                    <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2.5} dot={{r:3}} name="Avg Score %"/>
                    <Legend/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className={styles.card}>
              <h2>Question-Level Analysis</h2>
              <div className={styles.qTable}>
                <div className={styles.qHead}><span>#</span><span>Question</span><span>Difficulty</span><span>Accuracy</span><span>Answered</span><span>Avg Time</span></div>
                {data.questionStats.map((q, i) => (
                  <div key={q._id} className={styles.qRow}>
                    <span className={styles.qRowNum}>{i+1}</span>
                    <span className={styles.qRowText}>{q.text}…</span>
                    <span><div className={`${styles.diffChip} ${styles[q.difficulty]}`}>{q.difficulty}</div></span>
                    <span>
                      <div className={styles.accBar}>
                        <div className={styles.accFill} style={{width:`${q.accuracy}%`, background: parseFloat(q.accuracy)>=60?'#10b981':'#ef4444'}}/>
                        <span>{q.accuracy}%</span>
                      </div>
                    </span>
                    <span className={styles.qRowNum}>{q.totalAnswered}</span>
                    <span className={styles.qRowNum}>{q.avgTime}s</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h2>🛡️ Anti-Cheat Summary</h2>
              <div className={styles.antiGrid}>
                {[
                  { label:'Total Warnings', val:data.antiCheatStats.warnings, color:'#d97706' },
                  { label:'Tab Switches', val:data.antiCheatStats.tabSwitches, color:'#ef4444' },
                  { label:'Focus Lost', val:data.antiCheatStats.focusLost, color:'#7c3aed' },
                  { label:'Disqualified', val:data.antiCheatStats.disqualified, color:'#dc2626' },
                ].map(a => (
                  <div key={a.label} className={styles.antiCard} style={{borderTopColor:a.color}}>
                    <div className={styles.antiVal} style={{color:a.color}}>{a.val}</div>
                    <div className={styles.antiLabel}>{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
