import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  FileText, 
  Upload, 
  Settings, 
  MessageSquare,
  Crown,
  CheckCircle,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'PYQs', path: '/pyq', icon: FileText, premium: true },
  { name: 'Syllabus & Notes', path: '/syllabus', icon: BookOpen, premium: true },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'Contribute & Earn', path: '/contribute', icon: Upload },
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user, premiumOnlyMode, hasPremiumAccess } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-[60] md:z-auto w-72 sm:w-64 max-w-[85vw] shrink-0 glass-panel border-r border-slate-700/60 bg-slate-900/98 md:bg-slate-900/80 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-5 sm:p-6 border-b border-slate-700/60 flex items-center justify-between">
          <div>
            <div onClick={() => setIsOpen(false)}>
              <Logo size="md" to="/" textClassName="text-xl font-bold text-white tracking-wide" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm font-medium text-slate-300 truncate max-w-[150px]">{user?.name}</p>
              {user?.is_premium && <Crown className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />}
            </div>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-400">
              <span>Wallet: NPR {typeof user?.wallet_balance === 'number' ? user.wallet_balance.toFixed(2) : (user?.wallet_balance || '0.00')}</span>
            </div>
          </div>
          {/* Close button for mobile inside sidebar */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item: any) => {
            if (item.name === 'Contribute & Earn' && user?.role === 'admin') return null;

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#F5C21B]' : 'text-slate-400 group-hover:text-white'}`} />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}

          {premiumOnlyMode && user?.role === 'student' && !hasPremiumAccess && (
            <NavLink
              to="/get-premium"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mt-4 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25",
                  isActive && "ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900"
                )
              }
            >
              <Crown className="w-5 h-5 text-amber-400" />
              Get Premium
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="pt-4 pb-2 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Admin Control Center
              </div>
              <NavLink
                to="/admin"
                end
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-amber-500/15 text-[#F5C21B] border border-amber-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )
                }
              >
                <LayoutDashboard className="w-5 h-5 text-[#F5C21B]" />
                Admin Dashboard
              </NavLink>
              <NavLink
                to="/admin?tab=students"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-amber-500/15 text-[#F5C21B] border border-amber-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )
                }
              >
                <Users className="w-5 h-5" />
                Student Directory
              </NavLink>
              <NavLink
                to="/admin?tab=content"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-amber-500/15 text-[#F5C21B] border border-amber-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )
                }
              >
                <BookOpen className="w-5 h-5" />
                Content Library
              </NavLink>
              <NavLink
                to="/admin?tab=contributions"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-amber-500/15 text-[#F5C21B] border border-amber-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )
                }
              >
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Review Contributions
              </NavLink>
              <NavLink
                to="/admin?tab=subscriptions"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-amber-500/15 text-[#F5C21B] border border-amber-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )
                }
              >
                <CreditCard className="w-5 h-5 text-amber-400" />
                Manage Subscriptions
              </NavLink>
              <NavLink
                to="/admin?tab=withdrawals"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive 
                      ? "bg-amber-500/15 text-[#F5C21B] border border-amber-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )
                }
              >
                <DollarSign className="w-5 h-5 text-purple-400" />
                Withdrawal Payouts
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};
