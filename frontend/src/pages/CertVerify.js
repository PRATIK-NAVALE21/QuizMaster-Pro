import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';
import { format } from 'date-fns';
import styles from './CertVerify.module.css';

export default function CertVerify() {
  const { certId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    api.get(`/certificates/verify/${certId}`).then(r => { setData(r.data.data); setValid(true); }).catch(() => setValid(false)).finally(() => setLoading(false));
  }, [certId]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <MdQuiz size={32} color="var(--primary)"/>
          <div><h1>QuizMaster Pro</h1><p>Certificate Verification</p></div>
        </div>
        {loading ? <div className={styles.center}><div className="spinner"/></div> : valid && data ? (
          <div className={styles.cert}>
            <div className={styles.certBadge}><FiCheckCircle size={40} color="#10b981"/></div>
            <h2>Certificate Verified ✅</h2>
            <p className={styles.certSub}>This certificate is authentic and issued by QuizMaster Pro</p>
            <div className={styles.certBody}>
              <div className={styles.certSeal}>🎓</div>
              <p className={styles.certTitle}>Certificate of Achievement</p>
              <p className={styles.certRecipient}>This certifies that</p>
              <h3 className={styles.certName}>{data.studentName}</h3>
              <p className={styles.certText}>has successfully completed</p>
              <h4 className={styles.certQuiz}>{data.quizTitle}</h4>
              <p className={styles.certSubject}>{data.subject}</p>
              <div className={styles.certScore}>
                <div><strong>{data.score?.toFixed(1)}%</strong><small>Score</small></div>
                <div><strong>{data.obtainedMarks}/{data.totalMarks}</strong><small>Marks</small></div>
                <div><strong>{format(new Date(data.issuedAt),'MMM d, yyyy')}</strong><small>Issued On</small></div>
              </div>
              <p className={styles.certId}>Certificate ID: <code>{certId}</code></p>
            </div>
          </div>
        ) : (
          <div className={styles.invalid}>
            <FiXCircle size={48} color="#ef4444"/>
            <h2>Invalid Certificate</h2>
            <p>This certificate ID does not exist or has been revoked.</p>
          </div>
        )}
        <Link to="/" className={styles.homeBtn}>← Back to QuizMaster Pro</Link>
      </div>
    </div>
  );
}
