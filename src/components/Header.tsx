import React from 'react';
import {
  Download,
  AlertTriangle,
  LogOut,
  User
} from 'lucide-react';
import { BatchProgress, RankedCandidate, JobDescription } from '../types';
import { exportCandidatesToCsv } from '../lib/csvExport';

interface HeaderProps {
  activeTab: 'home' | 'upload' | 'results' | 'dashboard';
  setActiveTab: (tab: 'home' | 'upload' | 'results' | 'dashboard') => void;
  candidateCount: number;
  failedCount: number;
  jobTitle?: string;
  batchProgress: BatchProgress | null;
  isProcessing: boolean;
  candidates: RankedCandidate[];
  jobDescription: JobDescription | null;
  currentUser?: string | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  candidateCount,
  failedCount,
  jobTitle,
  batchProgress,
  isProcessing,
  candidates,
  jobDescription,
  currentUser,
  onLogout,
}) => {
  const handleExportCsv = () => {
    if (candidates.length === 0) return;
    exportCandidatesToCsv(candidates, jobDescription?.title || 'Resume-Matches');
  };

  const progressPercent = batchProgress && batchProgress.total > 0
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : isProcessing ? 50 : 100;

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20">
      {/* Left info: Active tab & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {activeTab === 'home' ? (
            <span className="font-semibold text-xs sm:text-sm text-slate-900 tracking-tight">
              ResumeAI
            </span>
          ) : (
            <h2 className="font-semibold text-xs sm:text-sm text-slate-900 tracking-tight truncate max-w-xs sm:max-w-md">
              {jobTitle && jobTitle.trim().length > 0 ? jobTitle : 'Resume Matcher'}
            </h2>
          )}

          {isProcessing ? (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
              Scanning...
            </span>
          ) : candidateCount > 0 ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              {candidateCount} Matched
            </span>
          ) : (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              Ready
            </span>
          )}
        </div>

        {failedCount > 0 && (
          <span
            title={`${failedCount} unreadable file(s) skipped`}
            className="hidden lg:inline-flex text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {failedCount} Skipped
          </span>
        )}
      </div>

      {/* Right controls: Progress & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Progress bar if active */}
        {isProcessing && batchProgress && (
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 font-medium">Scanning Progress</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {batchProgress.current} / {batchProgress.total}
              </span>
              <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Export CSV Button */}
        {candidates.length > 0 && (
          <button
            id="btn-export-csv-header"
            onClick={handleExportCsv}
            title="Download results as CSV"
            className="text-xs px-2.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors bg-slate-900 text-white hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        )}

        {/* User profile & Log Out */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md max-w-[160px] truncate" title={currentUser}>
              <User className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{currentUser}</span>
            </div>
            {onLogout && (
              <button
                id="btn-header-logout"
                onClick={onLogout}
                title="Log out of ResumeAI"
                className="text-xs px-2.5 py-1.5 rounded-md font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
