import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

const Landing        = lazy(() => import('./pages/Landing'));
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const CertVerify     = lazy(() => import('./pages/CertVerify'));

const StudentDashboard  = lazy(() => import('./pages/student/Dashboard'));
const StudentQuizzes    = lazy(() => import('./pages/student/Quizzes'));
const TakeQuiz          = lazy(() => import('./pages/student/TakeQuiz'));
const QuizResult        = lazy(() => import('./pages/student/QuizResult'));
const StudentHistory    = lazy(() => import('./pages/student/History'));
const StudentProfile    = lazy(() => import('./pages/student/Profile'));
const StudentAnalytics  = lazy(() => import('./pages/student/Analytics'));
const Leaderboard       = lazy(() => import('./pages/student/Leaderboard'));

const FacultyDashboard  = lazy(() => import('./pages/faculty/Dashboard'));
const ManageQuizzes     = lazy(() => import('./pages/faculty/ManageQuizzes'));
const CreateQuiz        = lazy(() => import('./pages/faculty/CreateQuiz'));
const EditQuiz          = lazy(() => import('./pages/faculty/EditQuiz'));
const QuizResults       = lazy(() => import('./pages/faculty/QuizResults'));
const FacultyProfile    = lazy(() => import('./pages/faculty/Profile'));
const FacultyAnalytics  = lazy(() => import('./pages/faculty/Analytics'));

const Loader = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#f0f4f8'}}>
    <div className="spinner" />
  </div>
);

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} replace />;
  return children;
};
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to={user.role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{
          duration: 3500,
          style: { borderRadius:'12px', fontFamily:'Inter,sans-serif', fontSize:'14px', boxShadow:'0 10px 40px rgba(0,0,0,0.12)' }
        }} />
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/verify-certificate/:certId" element={<CertVerify />} />

            {/* Student */}
            <Route path="/student/dashboard"  element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/quizzes"    element={<ProtectedRoute role="student"><StudentQuizzes /></ProtectedRoute>} />
            <Route path="/student/quiz/:id"   element={<ProtectedRoute role="student"><TakeQuiz /></ProtectedRoute>} />
            <Route path="/student/result/:id" element={<ProtectedRoute role="student"><QuizResult /></ProtectedRoute>} />
            <Route path="/student/history"    element={<ProtectedRoute role="student"><StudentHistory /></ProtectedRoute>} />
            <Route path="/student/analytics"  element={<ProtectedRoute role="student"><StudentAnalytics /></ProtectedRoute>} />
            <Route path="/student/leaderboard" element={<ProtectedRoute role="student"><Leaderboard /></ProtectedRoute>} />
            <Route path="/student/profile"    element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />

            {/* Faculty */}
            <Route path="/faculty/dashboard"         element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/quizzes"           element={<ProtectedRoute role="faculty"><ManageQuizzes /></ProtectedRoute>} />
            <Route path="/faculty/quiz/create"       element={<ProtectedRoute role="faculty"><CreateQuiz /></ProtectedRoute>} />
            <Route path="/faculty/quiz/:id/edit"     element={<ProtectedRoute role="faculty"><EditQuiz /></ProtectedRoute>} />
            <Route path="/faculty/quiz/:id/results"  element={<ProtectedRoute role="faculty"><QuizResults /></ProtectedRoute>} />
            <Route path="/faculty/analytics"         element={<ProtectedRoute role="faculty"><FacultyAnalytics /></ProtectedRoute>} />
            <Route path="/faculty/profile"           element={<ProtectedRoute role="faculty"><FacultyProfile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
