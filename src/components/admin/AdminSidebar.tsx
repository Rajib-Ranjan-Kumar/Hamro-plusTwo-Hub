import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  FileText, 
  UploadCloud, 
  CheckSquare, 
  ShieldAlert, 
  CreditCard, 
  DollarSign, 
  Bell, 
  History, 
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export type AdminTab = 
  | 'overview' 
  | 'analytics' 
  | 'students' 
  | 'content' 
  | 'colleges' 
  | 'subjects' 
  | 'contributions' 
  | 'reported' 
  | 'subscriptions' 
  | 'withdrawals' 
  | 'notifications' 
  | 'audit-logs' 
  | 'settings';

interface SidebarGroup {
  id: string;
  label: string;
  items: {
    id: AdminTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
  }[];
}

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingCounts?: {
    contributions: number;
    subscriptions: number;
    withdrawals: number;
    reported: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  pendingCounts = { contributions: 0, subscriptions: 0, withdrawals: 0, reported: 0 }
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    main: true,
    academic: true,
    community: true,
    financial: true,
    system: true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const menuGroups: SidebarGroup[] = [
    {
      id: 'main',
      label: 'MAIN',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    },
    {
      id: 'academic',
      label: 'ACADEMIC MANAGEMENT',
      items: [
        { id: 'students', label: 'Students', icon: Users },
        { id: 'content', label: 'Content Library', icon: BookOpen },
        { id: 'colleges', label: 'Colleges', icon: GraduationCap },
        { id: 'subjects', label: 'Subjects', icon: Layers },
      ]
    },
    {
      id: 'community',
      label: 'COMMUNITY & REVIEW',
      items: [
        { 
          id: 'contributions', 
          label: 'Contributions', 
          icon: CheckSquare,
          badge: pendingCounts.contributions > 0 ? pendingCounts.contributions : undefined
        },
        { 
          id: 'reported', 
          label: 'Moderation', 
          icon: ShieldAlert,
          badge: pendingCounts.reported > 0 ? pendingCounts.reported : undefined
        },
      ]
    },
    {
      id: 'financial',
      label: 'FINANCIAL MANAGEMENT',
      items: [
        { 
          id: 'subscriptions', 
          label: 'Subscriptions', 
          icon: CreditCard,
          badge: pendingCounts.subscriptions > 0 ? pendingCounts.subscriptions : undefined
        },
        { 
          id: 'withdrawals', 
          label: 'Withdrawals', 
          icon: DollarSign,
          badge: pendingCounts.withdrawals > 0 ? pendingCounts.withdrawals : undefined
        },
      ]
    },
    {
      id: 'system',
      label: 'SYSTEM & LOGS',
      items: [
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'audit-logs', label: 'Audit Logs', icon: History },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#080A0E] border-r border-white/10 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#F4B400] to-[#F5C21B] flex items-center justify-center shrink-0 shadow-lg shadow-[#F4B400]/20">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-white truncate">Hamro +2 Hub</span>
              <span className="text-[10px] font-semibold text-[#F5C21B] uppercase tracking-wider">Admin Center</span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        <button 
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
        {menuGroups.map(group => {
          const isExpanded = expandedGroups[group.id] !== false;
          return (
            <div key={group.id} className="space-y-1">
              {(!collapsed || mobileOpen) ? (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-300 tracking-wider uppercase transition-colors"
                >
                  <span>{group.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              ) : (
                <div className="h-2" />
              )}

              <AnimatePresence initial={false}>
                {(isExpanded || collapsed) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            if (mobileOpen) onCloseMobile();
                          }}
                          title={collapsed ? item.label : undefined}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative cursor-pointer ${
                            isActive
                              ? 'bg-[#F4B400]/15 text-[#F5C21B] shadow-inner font-semibold'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                          }`}
                        >
                          {/* Active Pill Indicator */}
                          {isActive && (
                            <motion.span
                              layoutId="activeTabIndicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#F4B400] rounded-r-full"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}

                          <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#F5C21B]' : 'text-slate-400 group-hover:text-white'
                          }`} />

                          {(!collapsed || mobileOpen) && (
                            <span className="truncate flex-1 text-left">{item.label}</span>
                          )}

                          {item.badge && (!collapsed || mobileOpen) && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer Shortcut to Public Site */}
      <div className="p-3 border-t border-white/10 shrink-0">
        <Link
          to="/"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors ${
            collapsed && !mobileOpen ? 'justify-center' : ''
          }`}
          title="Exit to Student Portal"
        >
          <ExternalLink className="w-4 h-4 shrink-0 text-slate-500" />
          {(!collapsed || mobileOpen) && <span>Student Portal</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:block h-screen sticky top-0 transition-all duration-200 z-30 shrink-0 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 lg:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
