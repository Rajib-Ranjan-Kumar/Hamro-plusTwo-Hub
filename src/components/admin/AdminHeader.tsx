import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  ShieldCheck, 
  ExternalLink,
  Settings,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobile: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  pendingNotificationsCount?: number;
}

const TAB_TITLES: Record<AdminTab, { title: string; category: string }> = {
  'overview': { title: 'Executive Overview', category: 'Main' },
  'analytics': { title: 'Platform Analytics', category: 'Main' },
  'students': { title: 'Student Management', category: 'Academic' },
  'academic-structure': { title: 'Academic Hierarchy Structure', category: 'Academic' },
  'content': { title: 'Educational Content Hub', category: 'Academic' },
  'colleges': { title: 'Colleges & Institutions', category: 'Academic' },
  'subjects': { title: 'Curriculum & Subjects', category: 'Academic' },
  'contributions': { title: 'Contribution Reviews', category: 'Community' },
  'reported': { title: 'Content Moderation', category: 'Community' },
  'subscriptions': { title: 'Subscription Management', category: 'Financial' },
  'withdrawals': { title: 'Payout & Withdrawals', category: 'Financial' },
  'notifications': { title: 'System Notifications', category: 'System' },
  'audit-logs': { title: 'Audit Trail & Compliance', category: 'System' },
  'settings': { title: 'Platform Settings', category: 'System' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  searchQuery,
  onSearchChange,
  pendingNotificationsCount = 0
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMeta = TAB_TITLES[activeTab] || { title: 'Dashboard', category: 'Admin' };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="h-16 bg-[#080A0E]/80 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Toggle, Desktop Collapse, and Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="w-5 h-5 text-slate-400 hover:text-white" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-slate-400 hover:text-white" />
          )}
        </button>

        {/* Breadcrumb Hierarchy */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>Admin</span>
            <span>/</span>
            <span className="text-slate-400">{currentMeta.category}</span>
            <span>/</span>
            <span className="text-[#F5C21B] font-semibold truncate">{currentMeta.title}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate hidden sm:block">
            {currentMeta.title}
          </h1>
        </div>
      </div>

      {/* Right: Global Search, Notification Center, Profile Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        <div className="relative hidden md:block w-48 lg:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F4B400]/50 transition-colors"
          />
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => onSelectTab('notifications')}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors relative cursor-pointer"
          title="Notification Center"
        >
          <Bell className="w-5 h-5" />
          {pendingNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#080A0E]" />
          )}
        </button>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-white/10 bg-[#111827] hover:border-white/20 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                {user?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium leading-none">
                Super Admin
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#111827] border border-white/10 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2.5 border-b border-white/5">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> System Administrator
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onSelectTab('settings');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Platform Settings</span>
                </button>
                <Link
                  to="/"
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>View Public Website</span>
                </Link>
              </div>

              <div className="border-t border-white/5 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
