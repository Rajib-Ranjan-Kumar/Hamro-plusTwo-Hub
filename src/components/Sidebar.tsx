import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  FileText, 
  Video, 
  Upload, 
  TrendingUp, 
  Trophy, 
  Settings, 
  MessageSquare,
  Crown,
  CheckCircle
} from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/', icon: TrendingUp },
  { name: 'PYQs', path: '/pyq', icon: FileText, premium: true },
  { name: 'Syllabus & Notes', path: '/syllabus', icon: BookOpen, premium: true },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'Contribute & Earn', path: '/contribute', icon: Upload },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 shrink-0 glass-panel border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 hidden md:block">Hamro +2 Hub</h1>
          <div className="flex items-center gap-2 mt-1 md:mt-2">
            <p className="text-sm text-slate-500">{user?.name}</p>
            {user?.is_premium && <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />}
          </div>
          <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-600">
            <span>Wallet: NPR {user?.wallet_balance}</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item: any) => {
            if (item.name === 'Contribute & Earn' && user?.role === 'admin') return null;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group hover-lift",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" 
                      : "text-slate-600 hover:bg-slate-50/50 dark:text-slate-400 dark:hover:bg-slate-700/30"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}

          {user?.role === 'student' && !user?.is_premium && (
            <NavLink
              to="/get-premium"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-4 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                  isActive && "ring-2 ring-amber-500 ring-offset-2"
                )
              }
            >
              <Crown className="w-5 h-5" />
              Get Premium
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Admin Tools
              </div>
              <NavLink
                to="/verify-subscriptions"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" 
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )
                }
              >
                <CheckCircle className="w-5 h-5" />
                Verify Subscriptions
              </NavLink>
              <NavLink
                to="/verify-contributions"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" 
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )
                }
              >
                <FileText className="w-5 h-5" />
                Verify Contributions
              </NavLink>
              <NavLink
                to="/add-content"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" 
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )
                }
              >
                <Upload className="w-5 h-5" />
                Manage Content
              </NavLink>
              <NavLink
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" 
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700/50"
                  )
                }
              >
                <Settings className="w-5 h-5" />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};
