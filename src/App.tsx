/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Contribute } from './pages/Contribute';
import { Syllabus } from './pages/Syllabus';
import { Admin } from './pages/Admin';
import { AddContent } from './pages/AddContent';
import { PYQ } from './pages/PYQ';
import { Settings } from './pages/Settings';
import { Chat } from './pages/Chat';
import { GetPremium } from './pages/GetPremium';
import { VerifySubscriptions } from './pages/VerifySubscriptions';
import { HelmetProvider } from 'react-helmet-async';
import { VerifyContributions } from './pages/VerifyContributions';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsConditions } from './pages/legal/TermsConditions';
import { CookiePolicy } from './pages/legal/CookiePolicy';
import { Disclaimer } from './pages/legal/Disclaimer';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import { ServerError } from './pages/ServerError';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Analytics } from './components/Analytics';
import { TopProgressBar } from './components/TopProgressBar';
import { LoadingProvider } from './context/LoadingContext';
import { ViewerPage } from './pages/ViewerPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const HomeRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C21B]"></div>
      </div>
    );
  }

  return user ? <Layout /> : <Landing />;
};

/**
 * Wraps informational, legal, and error pages so they render properly
 * for both authenticated users (inside Layout) and guests (inside PublicLayout).
 */
const PublicPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F5C21B]"></div>
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <PublicLayout>{children}</PublicLayout>;
};

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <LoadingProvider>
            <TopProgressBar />
            <Analytics />
            <Routes>
              {/* Standalone Error Routes */}
              <Route path="/500" element={<PublicPage><ServerError /></PublicPage>} />
              <Route path="/viewer" element={<ProtectedRoute><ViewerPage /></ProtectedRoute>} />

              {/* Public & Legal Pages (Accessible to everyone) */}
              <Route path="/about" element={<PublicPage><About /></PublicPage>} />
              <Route path="/about-us" element={<Navigate to="/about" replace />} />
              <Route path="/contact" element={<PublicPage><Contact /></PublicPage>} />
              <Route path="/faq" element={<PublicPage><FAQ /></PublicPage>} />
              <Route path="/privacy-policy" element={<PublicPage><PrivacyPolicy /></PublicPage>} />
              <Route path="/terms-conditions" element={<PublicPage><TermsConditions /></PublicPage>} />
              <Route path="/cookie-policy" element={<PublicPage><CookiePolicy /></PublicPage>} />
              <Route path="/disclaimer" element={<PublicPage><Disclaimer /></PublicPage>} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Main Authenticated Application */}
              <Route path="/" element={<HomeRoute />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Navigate to="/" replace />} />
                <Route path="contribute" element={<ProtectedRoute><Contribute /></ProtectedRoute>} />
                <Route path="syllabus" element={<ProtectedRoute><Syllabus /></ProtectedRoute>} />
                <Route path="admin/*" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                <Route path="add-content" element={<Navigate to="/admin?tab=content" replace />} />
                <Route path="pyq" element={<ProtectedRoute><PYQ /></ProtectedRoute>} />
                <Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="get-premium" element={<ProtectedRoute><GetPremium /></ProtectedRoute>} />
                <Route path="premium" element={<Navigate to="/get-premium" replace />} />
                <Route path="verify-subscriptions" element={<Navigate to="/admin?tab=subscriptions" replace />} />
                <Route path="verify-contributions" element={<Navigate to="/admin?tab=contributions" replace />} />
                <Route path="leaderboard" element={<div className="p-8 text-center text-slate-500">Leaderboard coming soon...</div>} />
                <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              </Route>

              {/* Global 404 Catch-All */}
              <Route path="*" element={<PublicPage><NotFound /></PublicPage>} />
            </Routes>
          </LoadingProvider>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
