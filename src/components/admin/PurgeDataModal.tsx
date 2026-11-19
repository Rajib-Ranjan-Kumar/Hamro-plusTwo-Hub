import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, CheckCircle2, Loader2, ShieldAlert, RefreshCw, X } from 'lucide-react';
import { purgeAllPreviousData, PurgeResult } from '../../services/db';

interface PurgeDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: PurgeResult) => void;
}

export const PurgeDataModal: React.FC<PurgeDataModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [wipeMaterials, setWipeMaterials] = useState(true);
  const [wipeMessages, setWipeMessages] = useState(true);
  const [wipeNotifications, setWipeNotifications] = useState(true);
  const [wipeContacts, setWipeContacts] = useState(true);
  const [wipeWithdrawals, setWipeWithdrawals] = useState(true);
  const [resetCurriculum, setResetCurriculum] = useState(true);
  
  const [confirmWord, setConfirmWord] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmWord.trim().toUpperCase() === 'PURGE' || confirmWord.trim().toUpperCase() === 'DELETE';

  const handleStartPurge = async () => {
    if (!isConfirmed) return;
    setIsPurging(true);
    setErrorMsg('');
    setProgressPercent(5);
    setProgressMsg('Initializing purge sequence...');

    try {
      const result = await purgeAllPreviousData(
        {
          wipeMaterials,
          wipeMessages,
          wipeNotifications,
          wipeContacts,
          wipeWithdrawals,
          wipeCurriculum: resetCurriculum,
          reseedCurriculum: resetCurriculum,
        },
        (msg, percent) => {
          setProgressMsg(msg);
          setProgressPercent(percent);
        }
      );

      setPurgeResult(result);
      onSuccess?.(result);
    } catch (err: any) {
      console.error('Purge error:', err);
      setErrorMsg(err?.message || 'An error occurred during data purge.');
    } finally {
      setIsPurging(false);
    }
  };

  const handleClose = () => {
    if (isPurging) return;
    setPurgeResult(null);
    setConfirmWord('');
    setProgressMsg('');
    setProgressPercent(0);
    setErrorMsg('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-white my-8 relative">
        {/* Close Button */}
        {!isPurging && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Content */}
        {!purgeResult ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Purge All Dummy & Previous Data</h2>
                <p className="text-xs text-slate-400">Permanently wipe test records and delete associated Cloudinary PDFs</p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-xs sm:text-sm text-red-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Warning: This action cannot be undone!</strong>
                <span>All selected records will be permanently erased from Firestore, and physical PDF files will be deleted from Cloudinary & Cloud Storage. Your admin account will remain untouched.</span>
              </div>
            </div>

            {/* Checkboxes of items to purge */}
            <div className="space-y-2.5 bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm">
              <span className="font-semibold text-slate-300 block mb-2 text-xs uppercase tracking-wider">Select what to purge:</span>
              
              <label className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={wipeMaterials}
                  disabled={isPurging}
                  onChange={(e) => setWipeMaterials(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500 w-4 h-4"
                />
                <span>Wipe all Uploaded Materials, Question Papers & Solutions (Deletes Cloudinary PDFs)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={wipeMessages}
                  disabled={isPurging}
                  onChange={(e) => setWipeMessages(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500 w-4 h-4"
                />
                <span>Wipe all Chat Discussions & Student Messages</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={wipeNotifications}
                  disabled={isPurging}
                  onChange={(e) => setWipeNotifications(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500 w-4 h-4"
                />
                <span>Wipe all System Notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={wipeContacts}
                  disabled={isPurging}
                  onChange={(e) => setWipeContacts(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500 w-4 h-4"
                />
                <span>Wipe all Contact Us Messages & User Inquiries</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={wipeWithdrawals}
                  disabled={isPurging}
                  onChange={(e) => setWipeWithdrawals(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500 w-4 h-4"
                />
                <span>Wipe test Withdrawals, Subscriptions & Bookmarks</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={resetCurriculum}
                  disabled={isPurging}
                  onChange={(e) => setResetCurriculum(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-red-500 focus:ring-red-500 w-4 h-4"
                />
                <span>Reset & Reseed clean standard NEB Curriculum (Class 11 & 12)</span>
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-900/40 border border-red-500 text-red-200 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            {/* Progress Bar (when purging) */}
            {isPurging ? (
              <div className="space-y-2 py-3 bg-slate-950/80 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    {progressMsg || 'Processing...'}
                  </span>
                  <span className="font-bold text-red-400">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              /* Confirmation Input */
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Type <span className="font-bold text-red-400 select-all">PURGE</span> or <span className="font-bold text-red-400 select-all">DELETE</span> below to confirm:
                </label>
                <input
                  type="text"
                  placeholder="Type PURGE to confirm"
                  value={confirmWord}
                  onChange={(e) => setConfirmWord(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-sm font-mono uppercase tracking-wider"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPurging}
                className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartPurge}
                disabled={!isConfirmed || isPurging}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                {isPurging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Purging Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Wipe All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Completion Summary */
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-1">Purge Complete!</h2>
              <p className="text-xs text-slate-400">Database and Cloud storage have been cleaned successfully.</p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-left space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Materials & Papers Deleted:</span>
                <span className="font-semibold text-emerald-400">{purgeResult.materialsCount} records</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Cloud Storage / Cloudinary Files Destroyed:</span>
                <span className="font-semibold text-emerald-400">{purgeResult.filesDeletedCount} files</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Chat Messages Wiped:</span>
                <span className="font-semibold text-emerald-400">{purgeResult.messagesCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Notifications Cleared:</span>
                <span className="font-semibold text-emerald-400">{purgeResult.notificationsCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Contact Inquiries Cleared:</span>
                <span className="font-semibold text-emerald-400">{purgeResult.contactMessagesCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Withdrawals & Subscriptions Cleared:</span>
                <span className="font-semibold text-emerald-400">{purgeResult.withdrawalsCount}</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all shadow cursor-pointer"
            >
              Done & Refresh
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
