import React, { useState, useEffect } from 'react';
import {
  JobDescription,
  RankedCandidate,
  ScoringWeights,
  BatchProgress,
  FailedFile,
  ExtractedResume
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FrontPage } from './components/FrontPage';
import { UploadSection } from './components/UploadSection';
import { ResultsTable } from './components/ResultsTable';
import { DashboardView } from './components/DashboardView';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { LoginPage } from './components/LoginPage';
import { AdminLoginPage } from './components/AdminLoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { runResumeBatchPipeline } from './lib/geminiClient';
import { rankCandidates, DEFAULT_WEIGHTS } from './lib/scoringEngine';

export default function App() {
  // Path routing helper
  const checkIsAdminPath = (pathname: string, hash: string, search: string) => {
    if (pathname === '/admin-login' || hash === '#admin-login' || search.includes('admin=login') || pathname.endsWith('/admin-login')) {
      return '/admin-login';
    }
    if (pathname === '/admin' || hash === '#admin' || search.includes('admin=dashboard') || pathname.endsWith('/admin')) {
      return '/admin';
    }
    return pathname;
  };

  // Path routing state for private admin area vs normal app
  const [currentPath, setCurrentPath] = useState<string>(() =>
    checkIsAdminPath(window.location.pathname, window.location.hash, window.location.search)
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(checkIsAdminPath(window.location.pathname, window.location.hash, window.location.search));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Private Owner Shortcut: Press Ctrl + Shift + A (or Cmd + Shift + A) to open Admin Login directly
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigateTo('/admin-login');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(checkIsAdminPath(path, window.location.hash, window.location.search));
  };

  // Normal User Authentication State
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem('resumeai_user');
    } catch {
      return null;
    }
  });

  // Track active user activity across all devices & sessions
  useEffect(() => {
    try {
      fetch('/api/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser || undefined,
          source: currentUser ? 'direct' : 'visitor'
        })
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'results' | 'dashboard'>('home');
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);

  const [rankedCandidates, setRankedCandidates] = useState<RankedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);

  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [failedFiles, setFailedFiles] = useState<FailedFile[]>([]);

  // Re-rank if weights change dynamically
  useEffect(() => {
    if (rankedCandidates.length > 0 && jobDescription) {
      const rawCandidates: ExtractedResume[] = rankedCandidates.map(rc => ({
        id: rc.id,
        filename: rc.filename,
        name: rc.name,
        contact: rc.contact,
        email: rc.email,
        phone: rc.phone,
        skills: rc.skills,
        education: rc.education,
        education_level: rc.education_level,
        experience_years: rc.experience_years,
        experience_summary: rc.experience_summary,
        certifications: rc.certifications,
        parse_status: rc.parse_status,
        raw_text: rc.raw_text,
        is_duplicate: rc.is_duplicate,
      }));

      const reRanked = rankCandidates(rawCandidates, jobDescription, scoringWeights);
      setRankedCandidates(reRanked);
    }
  }, [scoringWeights]);

  const handleLoginSuccess = (email: string) => {
    setCurrentUser(email);
    try {
      localStorage.setItem('resumeai_user', email);
    } catch (e) {
      console.warn('Could not save user to localStorage', e);
    }
    setActiveTab('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('resumeai_user');
    } catch (e) {
      console.warn('Could not remove user from localStorage', e);
    }
  };

  // Run Batch Matching for uploaded files
  const handleStartProcessing = async () => {
    if (!jobDescription) {
      alert('Please enter and extract a Job Description first.');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please select or drag resume files (PDF, DOCX, or TXT).');
      return;
    }

    setIsProcessing(true);
    setBatchProgress({
      current: 0,
      total: selectedFiles.length,
      currentFilename: 'Starting batch processor...'
    });

    try {
      const result = await runResumeBatchPipeline({
        files: selectedFiles,
        jd: jobDescription,
        weights: scoringWeights,
        onProgress: (progress) => setBatchProgress(progress)
      });

      setRankedCandidates(result.ranked);
      setFailedFiles(result.failedFiles);
      setActiveTab('results');

      // Record analysis statistics in database
      fetch('/api/user/record-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser,
          count: selectedFiles.length
        })
      }).catch(() => {});
    } catch (error) {
      console.error('Batch processing failed:', error);
      alert('An error occurred while matching resumes. Please check your files.');
    } finally {
      setIsProcessing(false);
      setBatchProgress(null);
    }
  };

  // ==========================================
  // Private Admin Route Handling
  // ==========================================
  if (currentPath === '/admin-login') {
    return (
      <AdminLoginPage
        onLoginSuccess={() => {
          navigateTo('/admin');
        }}
        onBackToPublicSite={() => {
          navigateTo('/');
        }}
      />
    );
  }

  if (currentPath === '/admin') {
    const adminToken = sessionStorage.getItem('resumeai_admin_token');
    // If not authenticated as admin, require admin login first
    if (!adminToken) {
      return (
        <AdminLoginPage
          onLoginSuccess={() => {
            navigateTo('/admin');
          }}
          onBackToPublicSite={() => {
            navigateTo('/');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        onLogout={() => {
          sessionStorage.removeItem('resumeai_admin_token');
          sessionStorage.removeItem('resumeai_admin_user');
          navigateTo('/admin-login');
        }}
      />
    );
  }

  // ==========================================
  // Normal Public Website (Unchanged & Unrestricted)
  // ==========================================
  // If not logged in, show the minimalist SaaS Login Page
  if (!currentUser) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  // Once logged in, show the complete ResumeAI workspace
  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        candidateCount={rankedCandidates.length}
        failedCount={failedFiles.length}
        jobTitle={jobDescription?.title}
        isProcessing={isProcessing}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          candidateCount={rankedCandidates.length}
          failedCount={failedFiles.length}
          jobTitle={jobDescription?.title}
          batchProgress={batchProgress}
          isProcessing={isProcessing}
          candidates={rankedCandidates}
          jobDescription={jobDescription}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'home' && (
              <FrontPage
                onNavigate={setActiveTab}
                candidates={rankedCandidates}
                jobDescription={jobDescription}
                onSelectCandidate={(candidate) => setSelectedCandidate(candidate)}
              />
            )}

            {activeTab === 'upload' && (
              <UploadSection
                jobDescription={jobDescription}
                setJobDescription={setJobDescription}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                scoringWeights={scoringWeights}
                setScoringWeights={setScoringWeights}
                onStartProcessing={handleStartProcessing}
                batchProgress={batchProgress}
                isProcessing={isProcessing}
                failedFiles={failedFiles}
              />
            )}

            {activeTab === 'results' && (
              <ResultsTable
                candidates={rankedCandidates}
                jobDescription={jobDescription}
                onSelectCandidate={(candidate) => setSelectedCandidate(candidate)}
                onNavigateToUpload={() => setActiveTab('upload')}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                candidates={rankedCandidates}
                jobDescription={jobDescription}
                scoringWeights={scoringWeights}
                onNavigateToUpload={() => setActiveTab('upload')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Candidate Deep Dive Detail Modal */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          jobDescription={jobDescription}
          scoringWeights={scoringWeights}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
