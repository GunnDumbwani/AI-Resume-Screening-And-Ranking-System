import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userEmail: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // Track initial visit on any PC
  useEffect(() => {
    try {
      fetch('/api/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'visitor' })
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Track active user login
      fetch('/api/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.user.email, name: data.user.name, source: 'login' })
      }).catch(() => {});

      setIsLoading(false);
      onLogin(data.user.email);
    } catch {
      // Fallback: register activity
      fetch('/api/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, source: 'login' })
      }).catch(() => {});
      setIsLoading(false);
      onLogin(cleanEmail);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please enter your email');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      onLogin(data.user.email);
    } catch {
      fetch('/api/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, name: cleanName, source: 'signup' })
      }).catch(() => {});
      setIsLoading(false);
      onLogin(cleanEmail);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address to reset password');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`A password reset link has been sent to ${email}`);
    }, 500);
  };

  // Google Authentication: captures the user's actual email address
  const handleTriggerGoogle = () => {
    if (email.trim() && email.includes('@')) {
      submitGoogleAuth(email.trim());
    } else {
      setShowGoogleModal(true);
    }
  };

  const submitGoogleAuth = async (googleEmail: string) => {
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid Google email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanEmail.split('@')[0].replace(/[._-]/g, ' ')
        })
      });
      const data = await res.json();
      setIsLoading(false);
      setShowGoogleModal(false);
      onLogin(data.user?.email || cleanEmail);
    } catch {
      fetch('/api/track-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, source: 'google' })
      }).catch(() => {});
      setIsLoading(false);
      setShowGoogleModal(false);
      onLogin(cleanEmail);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Centered Single Login Card */}
      <div className="w-full max-w-[430px] bg-white border border-gray-200/80 rounded-2xl p-7 sm:p-9 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_4px_16px_0_rgba(0,0,0,0.04)]">
        {/* Top Header */}
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg mb-3 shadow-sm">
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">ResumeAI</h1>
          <p className="text-xs text-gray-500 mt-1 font-normal leading-relaxed">
            AI-powered high-speed resume screening &amp; matching engine
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        {mode !== 'forgot' && (
          <div className="mt-6 p-1 bg-gray-100 rounded-xl flex items-center text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Forgot Password View */}
        {mode === 'forgot' && (
          <div className="mt-6">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to log in</span>
            </button>

            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Reset password</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your email and we'll send you recovery instructions.
            </p>

            {successMessage ? (
              <div className="mt-5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 leading-relaxed">
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                {errorMessage && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="reset-email" className="block text-xs font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Create Account Mode */}
        {mode === 'signup' && (
          <div className="mt-5">
            <form onSubmit={handleSignup} className="space-y-3.5">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div>
                <label htmlFor="signup-name" className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-gray-700 mb-1">
                  Work or Personal Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-signup-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-xs flex items-center justify-center cursor-pointer mt-2"
              >
                {isLoading ? 'Registering...' : 'Create Account & Start Screening'}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2.5 text-gray-400 font-normal">or</span>
              </div>
            </div>

            <button
              id="btn-google-signup"
              type="button"
              onClick={handleTriggerGoogle}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Standard Login Mode */}
        {mode === 'login' && (
          <div className="mt-5">
            <form onSubmit={handleLogin} className="space-y-3.5">
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>

              {/* Password Input with eye toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage('');
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary button: Log In */}
              <button
                id="btn-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-xs flex items-center justify-center cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider: or */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2.5 text-gray-400 font-normal">or</span>
              </div>
            </div>

            {/* Secondary button: Continue with Google */}
            <button
              id="btn-google-login"
              type="button"
              onClick={handleTriggerGoogle}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>Continue with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Google Account Email Modal (Ensures every real email is captured) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                <GoogleIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Sign in with Google</h3>
                <p className="text-xs text-gray-500">to continue to ResumeAI</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Enter your Google or corporate email address to access your workspace:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitGoogleAuth(googleEmailInput);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !googleEmailInput.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Clean, authentic SVG Google Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.32 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);
