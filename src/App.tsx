/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
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
import { NotFound } from './pages/NotFound';
import { ServerError } from './pages/ServerError';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Analytics } from './components/Analytics';
import { ViewerPage } from './pages/ViewerPage';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Analytics />
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="/viewer" element={<ProtectedRoute><ViewerPage /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="contribute" element={<Contribute />} />
              <Route path="syllabus" element={<Syllabus />} />
              <Route path="admin/*" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="add-content" element={<ProtectedRoute requireAdmin><AddContent /></ProtectedRoute>} />
              <Route path="pyq" element={<PYQ />} />
              <Route path="chat" element={<ProtectedRoute requirePremium><Chat /></ProtectedRoute>} />
              <Route path="get-premium" element={<GetPremium />} />
              <Route path="premium" element={<Navigate to="/get-premium" replace />} />
              <Route path="verify-subscriptions" element={<ProtectedRoute requireAdmin><VerifySubscriptions /></ProtectedRoute>} />
              <Route path="verify-contributions" element={<ProtectedRoute requireAdmin><VerifyContributions /></ProtectedRoute>} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms-conditions" element={<TermsConditions />} />
              <Route path="cookie-policy" element={<CookiePolicy />} />
              <Route path="disclaimer" element={<Disclaimer />} />
              <Route path="contact" element={<Contact />} />
              <Route path="faq" element={<FAQ />} />
              {/* Placeholders for other routes */}
              <Route path="leaderboard" element={<div className="p-8 text-center text-slate-500">Leaderboard coming soon...</div>} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
