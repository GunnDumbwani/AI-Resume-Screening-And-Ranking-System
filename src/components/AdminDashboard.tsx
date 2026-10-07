import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  FileText,
  Activity,
  Search,
  LogOut,
  RefreshCw,
  Shield,
  Clock,
  Mail,
  Calendar,
  X,
  CheckCircle,
  Copy,
  Download,
  Laptop,
  Smartphone,
  Globe,
  Check
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalResumesUploaded: number;
  totalAnalysesCompleted: number;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'visitor';
  createdAt: string;
  lastLogin: string;
  resumesAnalyzed: number;
  status: 'Active' | 'Inactive';
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  source?: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalResumesUploaded: 0,
    totalAnalysesCompleted: 0,
  });
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('Gunn Dumbwani');
  const [adminEmail, setAdminEmail] = useState('gunndumbwani21@gmail.com');

  const fetchDashboardData = async (showLoadingState = true) => {
    const token = sessionStorage.getItem('resumeai_admin_token');
    if (!token) {
      onLogout();
      return;
    }

    if (showLoadingState) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/admin/dashboard-data', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('resumeai_admin_token');
        sessionStorage.removeItem('resumeai_admin_user');
        onLogout();
        return;
      }

      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (Array.isArray(data.users)) setUsers(data.users);

      const storedAdmin = sessionStorage.getItem('resumeai_admin_user');
      if (storedAdmin) {
        try {
          const parsed = JSON.parse(storedAdmin);
          if (parsed.name) setAdminName(parsed.name);
          if (parsed.email) setAdminEmail(parsed.email);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    // Auto-refresh every 20 seconds to see new users and live sessions in real time
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleUserStatus = async (user: UserItem) => {
    const token = sessionStorage.getItem('resumeai_admin_token');
    if (!token) return;

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const res = await fetch('/api/admin/update-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          status: newStatus
        })
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        if (selectedUser && selectedUser.id === user.id) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
        setActionSuccess(`User ${user.email} status set to ${newStatus}`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const copyToClipboard = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const exportUsersToCSV = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'IP Address', 'Device', 'Browser', 'OS', 'Source', 'Registration Date', 'Last Active Date', 'Resumes Screened'];
    const rows = users.map(u => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email.replace(/"/g, '""')}"`,
      u.role,
      u.status,
      u.ip || '127.0.0.1',
      u.device || 'Desktop',
      u.browser || 'Chrome',
      u.os || 'Windows',
      u.source || 'direct',
      u.createdAt,
      u.lastLogin,
      u.resumesAnalyzed || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resumeai_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.ip && user.ip.toLowerCase().includes(q)) ||
        (user.os && user.os.toLowerCase().includes(q)) ||
        (user.browser && user.browser.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ? true : user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 5) return 'Active now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
        <p className="text-sm font-medium text-slate-300">Loading ResumeAI Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Admin Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              ResumeAI Admin Control Center
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Live Monitoring
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Admin: <span className="text-slate-200 font-medium">{adminName}</span> ({adminEmail})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportUsersToCSV}
            title="Download CSV of all user emails and details"
            className="px-3 py-2 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => fetchDashboardData(false)}
            disabled={isRefreshing}
            title="Refresh dashboard metrics"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-7 space-y-7">
        {/* Toast / Alert */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs font-medium text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Metric Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Users &amp; Visitors</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalUsers}</p>
              <p className="text-[11px] text-slate-500 mt-1">Unique accounts recorded</p>
            </div>

            {/* Active Users */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Active Accounts</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.activeUsers}</p>
              <p className="text-[11px] text-slate-500 mt-1">In good standing &amp; active</p>
            </div>

            {/* Total Resumes Uploaded */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Total Resumes Screened</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalResumesUploaded}</p>
              <p className="text-[11px] text-slate-500 mt-1">Documents ingested for screening</p>
            </div>

            {/* Total Analyses Completed */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Screening Runs</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalAnalysesCompleted}</p>
              <p className="text-[11px] text-slate-500 mt-1">Match rankings &amp; extractions</p>
            </div>
          </div>
        </section>

        {/* Users Management Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                <span>User Directory &amp; Activity Log</span>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                  {filteredUsers.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every user email ID, device, operating system, IP address, and screening count
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, IP, device..."
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-60 sm:w-72"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Accounts</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="py-3 px-4">User Name &amp; Mail ID</th>
                  <th className="py-3 px-4">Device &amp; Browser</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-center">Resumes Screened</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-medium">No users found</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {searchQuery ? 'Try adjusting your search query' : 'Users will be logged here in real time'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isOnline = getRelativeTime(user.lastLogin) === 'Active now';
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        {/* Name & Mail ID */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                user.role === 'admin'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                              }`}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" title="Online now" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.role === 'admin' && (
                                  <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-mono mt-0.5">
                                <span>{user.email}</span>
                                <button
                                  type="button"
                                  onClick={(e) => copyToClipboard(user.email, e)}
                                  className="text-slate-500 hover:text-slate-200 p-0.5 rounded transition-colors"
                                  title="Copy Email ID"
                                >
                                  {copiedEmail === user.email ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Device & Browser */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {user.device === 'Mobile' ? (
                              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Laptop className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-slate-300 font-medium">
                              {user.os || 'Windows'}
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              &bull; {user.browser || 'Chrome'}
                            </span>
                          </div>
                          {user.source && (
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                              via {user.source}
                            </span>
                          )}
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {user.ip || '127.0.0.1'}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-medium text-[11px]">
                            {getRelativeTime(user.lastLogin)}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formatDateTime(user.lastLogin)}
                          </div>
                        </td>

                        {/* Resumes Screened */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-indigo-300 border border-slate-700/60 font-mono">
                            {user.resumesAnalyzed || 0}
                          </span>
                        </td>

                        {/* Account Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            user.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {user.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                            >
                              Details
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleUserStatus(user)}
                                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                                  user.status === 'Active'
                                    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                                }`}
                              >
                                {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 text-slate-500 text-[11px] flex items-center justify-between">
            <span>Showing {filteredUsers.length} of {users.length} total users</span>
            <span>Real-time persistence across all devices &amp; browsers</span>
          </div>
        </section>
      </main>

      {/* User Record Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-base">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {selectedUser.name}
                  {selectedUser.role === 'admin' && (
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-mono mt-0.5">
                  <span>{selectedUser.email}</span>
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(selectedUser.email, e)}
                    className="hover:text-white text-slate-400"
                    title="Copy Email"
                  >
                    {copiedEmail === selectedUser.email ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 py-3 border-y border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email ID
                </span>
                <span className="font-mono text-slate-200 font-semibold">{selectedUser.email}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> IP Address
                </span>
                <span className="font-mono text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {selectedUser.ip || '127.0.0.1'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5" /> Device / OS / Browser
                </span>
                <span className="text-slate-200 font-medium">
                  {selectedUser.os || 'Windows'} &bull; {selectedUser.browser || 'Chrome'} ({selectedUser.device || 'Desktop'})
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> First Joined
                </span>
                <span>{formatDate(selectedUser.createdAt)} ({formatDateTime(selectedUser.createdAt)})</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Last Active
                </span>
                <span className="text-emerald-400 font-medium">
                  {getRelativeTime(selectedUser.lastLogin)} ({formatDateTime(selectedUser.lastLogin)})
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Resumes Analyzed
                </span>
                <span className="font-bold text-indigo-400 font-mono text-sm">{selectedUser.resumesAnalyzed || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Account Status
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  selectedUser.status === 'Active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {selectedUser.status}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(selectedUser.email)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedEmail === selectedUser.email ? 'Copied!' : 'Copy Email'}</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedUser.role !== 'admin' && (
                  <button
                    onClick={() => handleToggleUserStatus(selectedUser)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      selectedUser.status === 'Active'
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {selectedUser.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
