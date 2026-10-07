import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToPublicSite?: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess, onBackToPublicSite }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Invalid admin credentials.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        // Strict security: exact error message as required
        setErrorMessage(data.error || 'Invalid admin credentials.');
        setIsLoading(false);
        return;
      }

      // Store admin session token
      sessionStorage.setItem('resumeai_admin_token', data.token);
      sessionStorage.setItem('resumeai_admin_user', JSON.stringify(data.admin));

      setIsLoading(false);
      onLoginSuccess();
    } catch (err) {
      setErrorMessage('Invalid admin credentials.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white">
      {/* Centered Private Admin Login Card */}
      <div className="w-full max-w-[400px] bg-[#111827] border border-slate-800 rounded-2xl p-8 sm:p-9 shadow-2xl">
        {/* Header */}
        <div className="text-center">
          <div className="w-11 h-11 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Admin Login</h1>
          <p className="text-xs text-slate-400 mt-1">Authorized personnel authentication</p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-6 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs font-medium text-rose-300 text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              autoComplete="email"
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-admin-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                'Login'
              )}
            </button>
          </div>

          {onBackToPublicSite && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onBackToPublicSite}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                &larr; Back to Website
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
