import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Admin Subcomponents
import { AdminSidebar, AdminTab } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { DashboardOverview } from '../components/admin/DashboardOverview';
import { StudentManagement } from '../components/admin/StudentManagement';
import { ContentManagement } from '../components/admin/ContentManagement';
import { AcademicStructureManager } from '../components/admin/AcademicStructureManager';
import { EducationalContentManager } from '../components/admin/EducationalContentManager';
import { ContributionManagement } from '../components/admin/ContributionManagement';
import { SubscriptionManagement } from '../components/admin/SubscriptionManagement';
import { WithdrawalManagement } from '../components/admin/WithdrawalManagement';
import { ReportedContent } from '../components/admin/ReportedContent';
import { AuditLogsView } from '../components/admin/AuditLogsView';
import { AdminNotificationsView } from '../components/admin/AdminNotificationsView';
import { AdminSettings } from '../components/admin/AdminSettings';

export const Admin = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab synchronized with URL search params
  const tabParam = (searchParams.get('tab') as AdminTab) || 'overview';
  const [activeTab, setActiveTab] = useState<AdminTab>(tabParam);

  // Layout State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Operational Pending Counters for Badges
  const [pendingCounts, setPendingCounts] = useState({
    contributions: 0,
    subscriptions: 0,
    withdrawals: 0,
    reported: 0
  });

  // Verify Admin Authorization
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Synchronize Tab with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: AdminTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Live Listeners for Pending Badges
  useEffect(() => {
    const unsubContrib = onSnapshot(
      query(collection(db, 'contributions'), where('status', '==', 'pending')),
      snap => setPendingCounts(prev => ({ ...prev, contributions: snap.size }))
    );

    const unsubSubs = onSnapshot(
      query(collection(db, 'subscription_requests'), where('status', '==', 'pending')),
      snap => setPendingCounts(prev => ({ ...prev, subscriptions: snap.size }))
    );

    const unsubWithdrawals = onSnapshot(
      query(collection(db, 'withdrawals'), where('status', '==', 'pending')),
      snap => setPendingCounts(prev => ({ ...prev, withdrawals: snap.size }))
    );

    return () => {
      unsubContrib();
      unsubSubs();
      unsubWithdrawals();
    };
  }, []);

  const totalNotifications = pendingCounts.contributions + pendingCounts.subscriptions + pendingCounts.withdrawals;

  return (
    <div className="min-h-screen bg-[#080A0E] text-slate-100 flex overflow-x-hidden font-sans">
      {/* SaaS Collapsible Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        mobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
        pendingCounts={pendingCounts}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080A0E]">
        {/* Top Header Bar */}
        <AdminHeader
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          onOpenMobile={() => setMobileDrawerOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          pendingNotificationsCount={totalNotifications}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'overview' && (
                <DashboardOverview onNavigateTab={handleTabChange} />
              )}

              {activeTab === 'analytics' && (
                <DashboardOverview onNavigateTab={handleTabChange} />
              )}

              {activeTab === 'students' && (
                <StudentManagement />
              )}

              {activeTab === 'academic-structure' && (
                <AcademicStructureManager initialTab="colleges" />
              )}

              {activeTab === 'content' && (
                <EducationalContentManager />
              )}

              {activeTab === 'colleges' && (
                <AcademicStructureManager initialTab="colleges" />
              )}

              {activeTab === 'subjects' && (
                <AcademicStructureManager initialTab="subjects" />
              )}

              {activeTab === 'contributions' && (
                <ContributionManagement />
              )}

              {activeTab === 'reported' && (
                <ReportedContent />
              )}

              {activeTab === 'subscriptions' && (
                <SubscriptionManagement />
              )}

              {activeTab === 'withdrawals' && (
                <WithdrawalManagement />
              )}

              {activeTab === 'notifications' && (
                <AdminNotificationsView onNavigateTab={handleTabChange} />
              )}

              {activeTab === 'audit-logs' && (
                <AuditLogsView />
              )}

              {activeTab === 'settings' && (
                <AdminSettings />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
