import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { investorProfiles, InvestorProfileSummary } from '@/utils/constants';

// V4 Color Palette - Refined Blue
const V4_COLORS_LIGHT = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8FAFC',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(37, 99, 235, 0.1)',
  inputBg: 'rgba(255, 255, 255, 0.9)',
  inputBorder: 'rgba(37, 99, 235, 0.2)',
  chipBg: 'rgba(37, 99, 235, 0.08)',
  chipBorder: 'rgba(37, 99, 235, 0.15)',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  progressBg: 'rgba(37, 99, 235, 0.1)',
  glassShadow: 'rgba(37, 99, 235, 0.08)',
};

const V4_COLORS_DARK = {
  primary: '#60A5FA',
  primaryDark: '#3B82F6',
  secondary: '#A78BFA',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  background: '#0F172A',
  cardBackground: 'rgba(30, 41, 59, 0.8)',
  cardBorder: 'rgba(96, 165, 250, 0.15)',
  inputBg: 'rgba(30, 41, 59, 0.9)',
  inputBorder: 'rgba(96, 165, 250, 0.25)',
  chipBg: 'rgba(96, 165, 250, 0.12)',
  chipBorder: 'rgba(96, 165, 250, 0.2)',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  progressBg: 'rgba(96, 165, 250, 0.15)',
  glassShadow: 'rgba(0, 0, 0, 0.3)',
};

// Hook to detect dark mode
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

// Hook to get current V4 colors
const useV4Colors = () => {
  const isDark = useDarkMode();
  return isDark ? V4_COLORS_DARK : V4_COLORS_LIGHT;
};

// Icon paths
const ICONS = {
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  plus: 'M12 4v16m8-8H4',
  close: 'M6 18L18 6M6 6l12 12',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M5 13l4 4L19 7',
};

// Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  colors
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  colors: typeof V4_COLORS_LIGHT;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl"
        style={{
          background: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: `0 25px 50px -12px ${colors.glassShadow}`
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all hover:opacity-70"
            style={{ background: colors.chipBg }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.textSecondary }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.close} />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const UsersPage = () => {
  const router = useRouter();
  const colors = useV4Colors();
  const isDark = useDarkMode();

  // Data state
  const [users, setUsers] = useState<InvestorProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InvestorProfileSummary | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    persona: 'Balanced Voyager',
    riskTolerance: 'Moderate',
    horizonYears: 5,
    monthlySip: 10000,
    goal: '',
    status: 'Active' as 'Active' | 'Review',
  });

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Review'>('all');
  const [filterPersona, setFilterPersona] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Use mock data from constants
      setUsers(investorProfiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
      const matchesPersona = filterPersona === 'all' || user.persona === filterPersona;
      const matchesRisk = filterRisk === 'all' || user.riskTolerance === filterRisk;
      return matchesSearch && matchesStatus && matchesPersona && matchesRisk;
    });
  }, [users, searchTerm, filterStatus, filterPersona, filterRisk]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPersona, filterRisk]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const avgSip = totalUsers > 0
      ? users.reduce((sum, u) => sum + u.monthlySip, 0) / totalUsers
      : 0;

    const personaCounts = users.reduce((acc, u) => {
      acc[u.persona] = (acc[u.persona] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPersona = Object.entries(personaCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalUsers,
      activeRate: activeRate.toFixed(1),
      avgSip: Math.round(avgSip).toLocaleString('en-IN'),
      topPersona: topPersona ? { name: topPersona[0], count: topPersona[1] } : null,
    };
  }, [users]);

  // CRUD handlers
  const handleCreate = () => {
    setIsCreateMode(true);
    setFormData({
      name: '',
      persona: 'Balanced Voyager',
      riskTolerance: 'Moderate',
      horizonYears: 5,
      monthlySip: 10000,
      goal: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (user: InvestorProfileSummary) => {
    setIsCreateMode(false);
    setSelectedUser(user);
    setFormData({
      name: user.name,
      persona: user.persona,
      riskTolerance: user.riskTolerance,
      horizonYears: user.horizonYears,
      monthlySip: user.monthlySip,
      goal: user.goal,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    try {
      if (isCreateMode) {
        const newUser: InvestorProfileSummary = {
          id: `inv-${Date.now()}`,
          ...formData,
        };
        setUsers([...users, newUser]);
        setSuccessMessage('User created successfully');
      } else if (selectedUser) {
        setUsers(users.map(u =>
          u.id === selectedUser.id ? { ...u, ...formData } : u
        ));
        setSuccessMessage('User updated successfully');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      setUsers(users.filter(u => u.id !== id));
      setSuccessMessage('User deleted successfully');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      <Navbar mode="admin" />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.users} />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>User Management</h1>
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                >
                  Admin
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Manage investor profiles, personas, and portfolio assignments.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/onboarding')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all hover:shadow-lg"
              style={{
                background: colors.chipBg,
                border: `1px solid ${colors.chipBorder}`,
                color: colors.primary
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Onboarding Flow
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.plus} />
              </svg>
              Add User
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{ background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${colors.success}` }}
          >
            <span style={{ color: colors.success }}>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-sm underline"
              style={{ color: colors.success }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center justify-between"
            style={{ background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${colors.error}` }}
          >
            <span style={{ color: colors.error }}>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-sm underline"
              style={{ color: colors.error }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Users */}
          <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)'}`,
              boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(37, 99, 235, 0.08)'}`
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-blue-400/10 to-transparent rotate-12 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>TOTAL USERS</p>
              <p className="text-xl font-bold mt-2" style={{ color: colors.textPrimary }}>{kpis.totalUsers}</p>
              <div className="mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.users} />
                </svg>
                <span className="text-xs" style={{ color: colors.textSecondary }}>Investor profiles</span>
              </div>
            </div>
          </div>

          {/* Active Rate */}
          <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)'}`,
              boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(37, 99, 235, 0.08)'}`
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-blue-400/10 to-transparent rotate-12 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>ACTIVE RATE</p>
              <p className="text-xl font-bold mt-2" style={{ color: colors.textPrimary }}>{kpis.activeRate}%</p>
              <div className="mt-3">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                    color: colors.success
                  }}
                >
                  Healthy
                </span>
              </div>
            </div>
          </div>

          {/* Average SIP */}
          <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)'}`,
              boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(37, 99, 235, 0.08)'}`
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-blue-400/10 to-transparent rotate-12 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>AVERAGE SIP</p>
              <p className="text-xl font-bold mt-2" style={{ color: colors.textPrimary }}>₹{kpis.avgSip}</p>
              <div className="mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.currency} />
                </svg>
                <span className="text-xs" style={{ color: colors.textSecondary }}>Monthly</span>
              </div>
            </div>
          </div>

          {/* Top Persona */}
          <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(147, 197, 253, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(59, 130, 246, 0.02) 100%)',
              backdropFilter: 'blur(24px)',
              border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)'}`,
              boxShadow: `0 8px 32px ${isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(37, 99, 235, 0.08)'}`
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-blue-400/10 to-transparent rotate-12 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.primary }}>TOP PERSONA</p>
              <p className="text-xl font-bold mt-2 truncate" style={{ color: colors.textPrimary }}>
                {kpis.topPersona?.name || 'N/A'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.primary }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.user} />
                </svg>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {kpis.topPersona?.count || 0} users
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div
          className="p-4 rounded-xl mb-6"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: colors.textTertiary }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.search} />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full h-10 pl-11 pr-4 rounded-xl text-sm transition-all focus:outline-none"
                  style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Active' | 'Review')}
                className="h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Review">Review</option>
              </select>
            </div>

            {/* Persona Filter */}
            <div>
              <select
                value={filterPersona}
                onChange={(e) => setFilterPersona(e.target.value)}
                className="h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="all">All Personas</option>
                <option value="Capital Guardian">Capital Guardian</option>
                <option value="Balanced Voyager">Balanced Voyager</option>
                <option value="Accelerated Builder">Accelerated Builder</option>
              </select>
            </div>

            {/* Risk Filter */}
            <div>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="all">All Risk Levels</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Growth">Growth</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: colors.cardBackground,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: `0 4px 24px ${colors.glassShadow}`
          }}
        >
          {/* Table Header Bar */}
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.chipBorder }}>
            <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              Investor Profiles
            </h2>
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              {filteredUsers.length} of {users.length} users
            </span>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: colors.primary }}
              />
            </div>
          ) : filteredUsers.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: colors.chipBg }}
              >
                <svg className="w-6 h-6" style={{ color: colors.textTertiary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.user} />
                </svg>
              </div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {searchTerm || filterStatus !== 'all' || filterPersona !== 'all' || filterRisk !== 'all'
                  ? 'No users match your filters'
                  : 'No users yet. Add your first user to get started.'}
              </p>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: colors.chipBg }}>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Name</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Persona</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Risk</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Horizon</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Monthly SIP</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Goal</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Status</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="transition-colors"
                      style={{
                        borderBottom: index < paginatedUsers.length - 1 ? `1px solid ${colors.chipBorder}` : undefined,
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.chipBg}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Name with avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                            style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Persona chip */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                        >
                          {user.persona}
                        </span>
                      </td>

                      {/* Risk Tolerance */}
                      <td className="px-4 py-3">
                        <span className="text-sm" style={{ color: colors.textSecondary }}>
                          {user.riskTolerance}
                        </span>
                      </td>

                      {/* Horizon */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                          {user.horizonYears} yrs
                        </span>
                      </td>

                      {/* Monthly SIP */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold" style={{ color: colors.primary }}>
                          ₹{user.monthlySip.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Goal (truncated) */}
                      <td className="px-4 py-3 max-w-[150px]">
                        <span className="text-sm truncate block" style={{ color: colors.textSecondary }}>
                          {user.goal}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded font-medium"
                          style={{
                            background: user.status === 'Active'
                              ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)')
                              : (isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.1)'),
                            color: user.status === 'Active' ? colors.success : colors.warning
                          }}
                        >
                          {user.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                            style={{ background: colors.chipBg, color: colors.textSecondary }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                            style={{ background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: colors.error }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredUsers.length > 0 && (
            <div
              className="p-4 border-t flex items-center justify-between"
              style={{ borderColor: colors.chipBorder }}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm" style={{ color: colors.textSecondary }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: colors.textTertiary }}>Per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-8 px-2 rounded-lg text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: colors.chipBg }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.textSecondary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: colors.chipBg }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.textSecondary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: currentPage === pageNum
                            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                            : colors.chipBg,
                          color: currentPage === pageNum ? 'white' : colors.textSecondary,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: colors.chipBg }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.textSecondary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg transition-all disabled:opacity-40"
                  style={{ background: colors.chipBg }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.textSecondary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isCreateMode ? 'Add User' : 'Edit User'}
        colors={colors}
      >
        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              NAME
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="Full name"
            />
          </div>

          {/* Two-column grid for Persona and Risk Tolerance */}
          <div className="grid grid-cols-2 gap-3">
            {/* Persona Select */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                PERSONA
              </label>
              <select
                value={formData.persona}
                onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="Capital Guardian">Capital Guardian</option>
                <option value="Balanced Voyager">Balanced Voyager</option>
                <option value="Accelerated Builder">Accelerated Builder</option>
              </select>
            </div>

            {/* Risk Tolerance Select */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                RISK TOLERANCE
              </label>
              <select
                value={formData.riskTolerance}
                onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              >
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Growth">Growth</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
          </div>

          {/* Horizon Years and Monthly SIP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                HORIZON YEARS
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.horizonYears}
                onChange={(e) => setFormData({ ...formData, horizonYears: parseInt(e.target.value) || 0 })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                MONTHLY SIP (INR)
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthlySip}
                onChange={(e) => setFormData({ ...formData, monthlySip: parseInt(e.target.value) || 0 })}
                className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
                style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              />
            </div>
          </div>

          {/* Goal Input */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              GOAL
            </label>
            <input
              type="text"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="Investment goal"
            />
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              STATUS
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Review' })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            >
              <option value="Active">Active</option>
              <option value="Review">Review</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-10 rounded-full font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: colors.chipBg, color: colors.textSecondary }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              {isCreateMode ? 'Add User' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
