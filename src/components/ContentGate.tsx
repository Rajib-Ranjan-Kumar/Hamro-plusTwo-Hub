import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContentGateProps {
  children: React.ReactNode;
  requirePremium?: boolean;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export const ContentGate: React.FC<ContentGateProps> = ({
  children,
  requirePremium = false,
  requireAdmin = false,
  fallback,
}) => {
  const { user, hasPremiumAccess } = useAuth();

  const isAuthorized = () => {
    if (requireAdmin && user?.role !== 'admin') return false;
    if (requirePremium && !hasPremiumAccess) return false;
    return true;
  };

  if (isAuthorized()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 bg-slate-800/50 rounded-2xl border border-slate-700 text-center">
      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Premium Content
      </h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        This content is restricted to premium members. Upgrade your account to unlock all features and materials.
      </p>
      <Link
        to="/get-premium"
        className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
};
