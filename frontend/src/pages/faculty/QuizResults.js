import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { FiArrowLeft, FiDownload, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import styles from './QuizResults.module.css';

const PIE_COLORS = ['#10b981','#ef4444'];

export default function QuizResults() {
  const { id } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([api.get(`/quizzes/${id}/results`), api.get(`/quizzes/${id}`)])
      .then(([rr, qr]) => { setAttempts(rr.data.data); setStats(rr.data.stats); setQuiz(qr.data.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const exportCSV = () => {
    const rows = [
      ['#','Student Name','Email','Student ID','Department','Score','Percentage','Status','Time Taken','Date'],
      ...attempts.map((a,i) => [i+1, a.student?.name, a.student?.email, a.student?.studentId||'—', a.student?.department||'—',
        `${a.obtainedMarks}/${a.totalMarks}`, `${a.percentage?.toFixed(1)}%`, a.isPassed?'Passed':'Failed',
        a.timeTaken ? `${Math.floor(a.timeTaken/60)}m ${a.timeTaken%60}s` : '—',
        format(new Date(a.createdAt),'yyyy-MM-dd HH:mm')])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    const a = document.createElement('a'); a.href=url; a.download=`${quiz?.title||'results'}.csv`; a.click();
  };

  const filtered = attempts.filter(a => {
    const mf = filter==='all' || (filter==='passed'&&a.isPassed) || (filter==='failed'&&!a.isPassed);
    const ms = !search || a.student?.name?.toLowerCase().includes(search.toLowerCase()) || a.student?.email?.toLowerCase().includes(search.toLowerCase()) || a.student?.studentId?.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const scoreDistribution = [
    {range:'0–20',count:attempts.filter(a=>a.percentage<=20).length},
    {range:'21–40',count:attempts.filter(a=>a.percentage>20&&a.percentage<=40).length},
    {range:'41–60',count:attempts.filter(a=>a.percentage>40&&a.percentage<=60).length},
    {range:'61–80',count:attempts.filter(a=>a.percentage>60&&a.percentage<=80).length},
    {range:'81–100',count:attempts.filter(a=>a.percentage>80).length},
  ];

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link to="/faculty/quizzes" className={styles.back}><FiArrowLeft size={15}/> Quizzes</Link>
          <div className={styles.topCenter}><h1>{quiz?.title}</h1><p>{quiz?.subject} · {attempts.length} submissions</p></div>
          <button onClick={exportCSV} className={styles.exportBtn}><FiDownload size={14}/> Export CSV</button>
        </div>

        {/* KPIs */}
        <div className={styles.kpiRow}>
          {[
            {label:'Submissions', val:stats?.totalAttempts||0, emoji:'📝', color:'#2563eb'},
            {label:'Passed', val:stats?.passCount||0, emoji:'✅', color:'#10b981'},
            {label:'Failed', val:stats?.failCount||0, emoji:'❌', color:'#ef4444'},
            {label:'Avg Score', val:`${stats?.averageScore||0}%`, emoji:'📊', color:'#7c3aed'},
            {label:'Highest', val:`${stats?.highestScore||0}%`, emoji:'🏆', color:'#d97706'},
            {label:'Pass Rate', val:stats?.totalAttempts?`${((stats.passCount/stats.totalAttempts)*100).toFixed(0)}%`:'0%', emoji:'🎯', color:'#0891b2'},
          ].map(k=>(
            <div key={k.label} className={styles.kpi} style={{'--kc':k.color}}>
              <span>{k.emoji}</span>
              <div className={styles.kpiVal}>{k.val}</div>
              <div className={styles.kpiLabel}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {attempts.length > 0 && (
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h2>Score Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution} margin={{top:4,right:4,left:-24,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="range" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                  <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                  <Bar dataKey="count" radius={[6,6,0,0]} name="Students">
                    {scoreDistribution.map((e,i) => <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#22c55e','#10b981'][i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h2>Pass / Fail Breakdown</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{name:'Passed',value:stats?.passCount||0},{name:'Failed',value:stats?.failCount||0}]}
                    cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value"
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {PIE_COLORS.map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h2>Individual Results ({filtered.length})</h2>
            <div className={styles.tableControls}>
              <div className={styles.searchWrap}><FiSearch className={styles.si}/><input placeholder="Search name, email, ID..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <div className={styles.tabs}>
                {[['all','All'],['passed','Passed'],['failed','Failed']].map(([v,l])=>(
                  <button key={v} className={`${styles.tab} ${filter===v?styles.activeTab:''}`} onClick={()=>setFilter(v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          {filtered.length === 0 ? <div className={styles.emptyTable}><p>No results match your filters.</p></div> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr><th>#</th><th>Student</th><th>ID</th><th>Score</th><th>%</th><th>Status</th><th>Rank</th><th>Time</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {filtered.map((a,i)=>(
                    <tr key={a._id}>
                      <td className={styles.tdNum}>{i+1}</td>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.sAvatar}>{a.student?.name?.charAt(0)}</div>
                          <div><div className={styles.sName}>{a.student?.name}</div><div className={styles.sEmail}>{a.student?.email}</div></div>
                        </div>
                      </td>
                      <td className={styles.tdGray}>{a.student?.studentId||'—'}</td>
                      <td><strong>{a.obtainedMarks}/{a.totalMarks}</strong></td>
                      <td>
                        <div className={styles.scoreBar}>
                          <div className={styles.scoreBarFill} style={{width:`${a.percentage}%`,background:a.isPassed?'#10b981':'#ef4444'}}/>
                          <span>{a.percentage?.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td><span className={`${styles.statusBadge} ${a.isPassed?styles.sPass:styles.sFail}`}>{a.isPassed?'✅ Passed':'❌ Failed'}</span></td>
                      <td className={styles.tdGray}>{a.rank?`#${a.rank}`:'—'}</td>
                      <td className={styles.tdGray}>{a.timeTaken?`${Math.floor(a.timeTaken/60)}m ${a.timeTaken%60}s`:'—'}</td>
                      <td className={styles.tdDate}>{format(new Date(a.createdAt),'MMM d, yy · h:mm a')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
