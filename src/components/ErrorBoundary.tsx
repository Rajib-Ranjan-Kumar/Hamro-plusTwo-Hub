import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';
import { getFriendlyErrorMessage } from '../utils/friendlyErrors';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const friendlyMessage = getFriendlyErrorMessage(
        this.state.error,
        'We encountered a temporary hiccup loading this page. Please try refreshing or return to the homepage.'
      );

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4 relative selection:bg-[#F5C21B]/30">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-lg w-full bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl text-center relative z-10 space-y-6">
            {/* Header Icon */}
            <div className="w-16 h-16 bg-amber-400/10 border border-amber-400/25 text-[#F5C21B] rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,194,27,0.15)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Error Message in Simple Terms */}
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-semibold text-amber-300">
                Notice
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Something Went Slightly Off Track
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed pt-1">
                {friendlyMessage}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm">
                Don't worry, your account and notes are completely safe. A quick refresh usually resolves this.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3 bg-[#F5C21B] hover:bg-[#e0b018] text-black font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-6 py-3 bg-slate-700/80 hover:bg-slate-700 text-white font-medium text-sm rounded-xl transition-all border border-slate-600 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Homepage</span>
              </button>
            </div>

            {/* Help Link & Optional Discrete Technical Details */}
            <div className="pt-4 border-t border-slate-700/60 flex flex-col items-center gap-2 text-xs text-slate-400">
              <a
                href="/contact"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need assistance? Contact our support team</span>
              </a>

              {this.state.error && (
                <button
                  type="button"
                  onClick={() => (this as any).setState((prev: State) => ({ showDetails: !prev.showDetails }))}
                  className="text-slate-500 hover:text-slate-400 text-[11px] underline mt-1 cursor-pointer"
                >
                  {this.state.showDetails ? 'Hide details' : 'Technical info'}
                </button>
              )}

              {this.state.showDetails && this.state.error && (
                <div className="w-full p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-slate-400 overflow-x-auto max-h-32">
                  {this.state.error.name}: {this.state.error.message}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
