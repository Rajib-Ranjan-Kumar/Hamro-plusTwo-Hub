import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  CreditCard, 
  DollarSign, 
  AlertTriangle, 
  Settings as SettingsIcon 
} from 'lucide-react';

// Import subcomponents
import { DashboardOverview } from '../components/admin/DashboardOverview';
import { UserManagement } from '../components/admin/UserManagement';
import { WithdrawalManagement } from '../components/admin/WithdrawalManagement';
import { ReportedContent } from '../components/admin/ReportedContent';
import { AdminSettings } from '../components/admin/AdminSettings';

type AdminTab = 'overview' | 'users' | 'withdrawals' | 'reported' | 'settings';

export const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
    { id: 'reported', label: 'Reported', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Admin Control Panel
        </h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Sidebar Navigation for Admin */}
        <div className="w-full xl:w-64 shrink-0">
          <div className="glass-panel rounded-2xl p-4 sticky top-6">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-white dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="glass-panel rounded-2xl p-6 min-h-[600px]">
            {activeTab === 'overview' && <DashboardOverview />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'withdrawals' && <WithdrawalManagement />}
            {activeTab === 'reported' && <ReportedContent />}
            {activeTab === 'settings' && <AdminSettings />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
