import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Upload,
  FileText,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Zap,
  Award,
  Users
} from 'lucide-react';
import { RankedCandidate, JobDescription } from '../types';

interface FrontPageProps {
  onNavigate: (tab: 'upload' | 'results' | 'dashboard') => void;
  candidates: RankedCandidate[];
  jobDescription: JobDescription | null;
  onSelectCandidate: (candidate: RankedCandidate) => void;
}

export const FrontPage: React.FC<FrontPageProps> = ({
  onNavigate,
  candidates,
  jobDescription,
  onSelectCandidate,
}) => {
  return (
    <div className="space-y-6 pb-8">
      {/* Eye-catching Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 p-6 sm:p-10 shadow-sm">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>ResumeAI • Smart Matcher</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Find the best resume matches for any job in seconds
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Upload your job description and candidate resumes. ResumeAI automatically compares skills, experience, and education to rank the best candidates with simple, transparent match scores.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-btn-scan-resumes"
              onClick={() => onNavigate('upload')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-indigo-500/20"
            >
              <span>Scan Resumes</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {candidates.length > 0 && (
              <button
                id="hero-btn-view-results"
                onClick={() => onNavigate('results')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 text-xs sm:text-sm font-medium transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>View Results ({candidates.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* If candidates were already scanned by the user in this session, show a clean banner */}
      {candidates.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                {candidates.length} Resumes Ready for Review
              </p>
              <p className="text-xs text-emerald-800">
                Top match: <strong>{candidates[0]?.name}</strong> ({Math.round(candidates[0]?.score.overall_score)}% match)
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            See Ranked List &rarr;
          </button>
        </div>
      )}

      {/* How it Works: 3 Simple Steps */}
      <div>
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">How It Works</h2>
          <p className="text-xs text-slate-500">Three easy steps to screen and rank resumes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center mb-3">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-900">Add Job Description</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Paste your job requirements or description. The system extracts required skills, experience, and education qualifications.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center mb-3">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900">Upload Resumes</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Select or drop your resume files in PDF, Word (DOCX), or TXT format. Files are read safely right in your browser.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-200 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center mb-3">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-900">See Match Results</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Get an instant ranked list with match percentages (0–100%), highlighted matching skills, and clear score breakdowns.
            </p>
          </div>
        </div>
      </div>

      {/* Key Highlights */}
      <div>
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Key Features</h2>
          <p className="text-xs text-slate-500">Simple, transparent, and accurate</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Fast &amp; Concurrent</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Scans multiple resumes at the same time so you don't have to wait.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Skill &amp; Experience Fit</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Compares exact skills, related skills, years of work, and degrees.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
              <Sliders className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Adjustable Weights</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Customize how much skills, experience, and education count toward the score.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">100% In-Browser Privacy</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your resume files remain in your browser session. No databases or tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-center space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-slate-900">
          Ready to test your resumes?
        </h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Paste your job description and drop in your resume files to see how candidates rank.
        </p>
        <button
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Resumes Now</span>
        </button>
      </div>
    </div>
  );
};
