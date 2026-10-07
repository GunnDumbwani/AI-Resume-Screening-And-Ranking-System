import React from 'react';
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  LogOut,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'upload' | 'results' | 'dashboard';
  setActiveTab: (tab: 'home' | 'upload' | 'results' | 'dashboard') => void;
  candidateCount: number;
  failedCount: number;
  jobTitle?: string;
  isProcessing: boolean;
  currentUser?: string | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  candidateCount,
  failedCount,
  jobTitle,
  isProcessing,
  currentUser,
  onLogout,
}) => {
  return (
    <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-100" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">ResumeAI</h1>
            <p className="text-[10px] text-slate-400 font-medium">Smart Resume Matcher</p>
          </div>
        </div>
      </div>

      {/* Target Job Role Badge - only shown when job title is actually given */}
      {jobTitle && jobTitle.trim().length > 0 && (
        <div className="px-3 pt-3">
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-md px-2.5 py-1.5">
            <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">Target Job</p>
            <p className="text-xs text-white font-medium truncate" title={jobTitle}>{jobTitle}</p>
          </div>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1">
          Menu
        </p>

        {/* Home */}
        <button
          id="nav-tab-home"
          onClick={() => setActiveTab('home')}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeTab === 'home'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>Home</span>
          </div>
        </button>

        {/* Scan Resumes */}
        <button
          id="nav-tab-upload"
          onClick={() => setActiveTab('upload')}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeTab === 'upload'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Scan Resumes</span>
          </div>
          {isProcessing && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        {/* Results */}
        <button
          id="nav-tab-results"
          onClick={() => setActiveTab('results')}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeTab === 'results'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Results</span>
          </div>
          {candidateCount > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'results' ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-300 border border-indigo-500/20'
            }`}>
              {candidateCount}
            </span>
          )}
        </button>

        {/* Insights & Charts */}
        <button
          id="nav-tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs'
              : 'hover:bg-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Insights &amp; Charts</span>
          </div>
        </button>
      </nav>

      {/* User Session & Logout */}
      {currentUser && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-slate-200 truncate" title={currentUser}>
                  {currentUser}
                </p>
                <p className="text-[9px] text-emerald-400 font-medium">Logged in</p>
              </div>
            </div>

            {onLogout && (
              <button
                id="btn-sidebar-logout"
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
