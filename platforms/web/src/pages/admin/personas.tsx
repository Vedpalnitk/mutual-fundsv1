import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  personasApi,
  mlApi,
  Persona,
  PersonaRule,
  PersonaInsight,
  ClassificationLog,
  ClassificationStats,
  ClassificationResult,
  SaveClassificationRequest,
  BlendedClassifyResponse,
  AllocationBreakdown,
} from '@/services/api';
import { personaProfiles } from '@/utils/constants';

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

// Icon paths as strings
const ICONS = {
  plus: 'M12 4v16m8-8H4',
  close: 'M6 18L18 6M6 6l12 12',
  rules: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  insights: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  beaker: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  play: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M5 13l4 4L19 7',
  copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
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

// Set to false to use real backend API
const useMockData = false;

// Tab type
type TabType = 'personas' | 'bulk' | 'classify' | 'results';

const PersonasPage = () => {
  const colors = useV4Colors();
  const isDark = useDarkMode();
  const [activeTab, setActiveTab] = useState<TabType>('personas');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Classification Results state
  const [classificationLogs, setClassificationLogs] = useState<ClassificationLog[]>([]);
  const [classificationStats, setClassificationStats] = useState<ClassificationStats | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Classification Tester state
  const [classifyProfile, setClassifyProfile] = useState({
    horizonYears: 10,
    liquidity: 'Medium',
    riskTolerance: 'Moderate',
    volatility: 'Medium',
    knowledge: 'Intermediate',
  });
  const [classifyUserData, setClassifyUserData] = useState({
    name: '',
    email: '',
    age: 30,
    targetAmount: 1000000,
    monthlySip: 10000,
  });
  const [classifyResult, setClassifyResult] = useState<ClassificationResult | null>(null);
  const [blendedResult, setBlendedResult] = useState<BlendedClassifyResponse | null>(null);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [useBlendedMode, setUseBlendedMode] = useState(true);

  // Bulk Create state
  const [bulkPersonas, setBulkPersonas] = useState<Array<{
    name: string;
    slug: string;
    description: string;
    riskBand: string;
    colorPrimary: string;
    colorSecondary: string;
  }>>([
    { name: '', slug: '', description: '', riskBand: 'Balanced Growth', colorPrimary: '#2563EB', colorSecondary: '#5856D6' },
  ]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    riskBand: 'Balanced Growth',
    iconName: '',
    colorPrimary: '#2563EB',
    colorSecondary: '#5856D6',
    isActive: true,
  });

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    setLoading(true);
    try {
      if (useMockData) {
        // Use mock data
        const mockPersonas: Persona[] = personaProfiles.map((p, i) => ({
          id: `persona-${i + 1}`,
          name: p.name,
          slug: p.name.toLowerCase().replace(/\s+/g, '-'),
          description: p.description,
          riskBand: p.riskBand,
          iconName: 'chart',
          colorPrimary: '#2563EB',
          colorSecondary: '#5856D6',
          displayOrder: i,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rules: [],
          insights: [],
        }));
        setPersonas(mockPersonas);
      } else {
        const data = await personasApi.list();
        setPersonas(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreateMode(true);
    setFormData({
      name: '',
      slug: '',
      description: '',
      riskBand: 'Balanced Growth',
      iconName: '',
      colorPrimary: '#2563EB',
      colorSecondary: '#5856D6',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (persona: Persona) => {
    setIsCreateMode(false);
    setSelectedPersona(persona);
    setFormData({
      name: persona.name,
      slug: persona.slug,
      description: persona.description || '',
      riskBand: persona.riskBand,
      iconName: persona.iconName || '',
      colorPrimary: persona.colorPrimary || '#2563EB',
      colorSecondary: persona.colorSecondary || '#5856D6',
      isActive: persona.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (useMockData) {
        if (isCreateMode) {
          const newPersona: Persona = {
            id: `persona-${Date.now()}`,
            ...formData,
            displayOrder: personas.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            rules: [],
            insights: [],
          };
          setPersonas([...personas, newPersona]);
        } else if (selectedPersona) {
          setPersonas(personas.map(p => p.id === selectedPersona.id ? { ...p, ...formData, updatedAt: new Date().toISOString() } : p));
        }
      } else {
        if (isCreateMode) {
          await personasApi.create(formData);
        } else if (selectedPersona) {
          await personasApi.update(selectedPersona.id, formData);
        }
        await loadPersonas();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;
    try {
      if (useMockData) {
        setPersonas(personas.filter(p => p.id !== id));
      } else {
        await personasApi.delete(id);
        await loadPersonas();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRiskBandStyle = (band: string) => {
    switch (band) {
      case 'Capital Protection':
        return { bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)', color: colors.success };
      case 'Balanced Growth':
        return { bg: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(37, 99, 235, 0.1)', color: colors.primary };
      case 'Accelerated Growth':
        return { bg: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(124, 58, 237, 0.1)', color: colors.secondary };
      default:
        return { bg: colors.chipBg, color: colors.textSecondary };
    }
  };

  // Bulk Create handlers
  const addBulkPersonaRow = () => {
    setBulkPersonas([...bulkPersonas, { name: '', slug: '', description: '', riskBand: 'Balanced Growth', colorPrimary: '#2563EB', colorSecondary: '#5856D6' }]);
  };

  const removeBulkPersonaRow = (index: number) => {
    setBulkPersonas(bulkPersonas.filter((_, i) => i !== index));
  };

  const updateBulkPersona = (index: number, field: string, value: string) => {
    const updated = [...bulkPersonas];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'name') {
      updated[index].slug = value.toLowerCase().replace(/\s+/g, '-');
    }
    setBulkPersonas(updated);
  };

  const handleBulkCreate = async () => {
    const validPersonas = bulkPersonas.filter(p => p.name && p.slug);
    if (validPersonas.length === 0) {
      setError('Please add at least one valid persona with name and slug');
      return;
    }

    setBulkLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await personasApi.bulkCreate(validPersonas.map(p => ({
        ...p,
        isActive: true,
      })));

      if (result.created.length > 0) {
        setSuccessMessage(`Successfully created ${result.created.length} persona(s)`);
        await loadPersonas();
        setBulkPersonas([{ name: '', slug: '', description: '', riskBand: 'Balanced Growth', colorPrimary: '#2563EB', colorSecondary: '#5856D6' }]);
      }

      if (result.failed.length > 0) {
        setError(`Failed to create ${result.failed.length} persona(s): ${result.failed.map(f => f.error).join(', ')}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Classification handlers
  const handleClassify = async (saveToDb: boolean = false) => {
    setClassifyLoading(true);
    setError(null);
    setClassifyResult(null);
    setBlendedResult(null);

    try {
      if (useBlendedMode) {
        // Use ML service for blended classification
        const mlRequest = {
          request_id: `test-${Date.now()}`,
          profile: {
            age: classifyUserData.age,
            goal: 'Wealth Creation',
            target_amount: classifyUserData.targetAmount,
            monthly_sip: classifyUserData.monthlySip,
            liquidity: classifyProfile.liquidity as 'Low' | 'Medium' | 'High',
            risk_tolerance: classifyProfile.riskTolerance as 'Conservative' | 'Moderate' | 'Aggressive',
            knowledge: classifyProfile.knowledge as 'Beginner' | 'Intermediate' | 'Advanced',
            volatility: classifyProfile.volatility as 'Low' | 'Medium' | 'High',
            horizon_years: classifyProfile.horizonYears,
          },
        };

        const blended = await mlApi.classifyBlended(mlRequest);
        setBlendedResult(blended);

        // Also save to DB if requested
        if (saveToDb && classifyUserData.email) {
          const request: SaveClassificationRequest = {
            profile: classifyProfile,
            ...classifyUserData,
          };
          const result = await personasApi.classifyAndSave(request);
          setClassifyResult(result);
          setSuccessMessage('Classification saved to database');
        }
      } else {
        // Use rules-based classification
        const request: SaveClassificationRequest = {
          profile: classifyProfile,
          ...(saveToDb && classifyUserData.email ? classifyUserData : {}),
        };

        const result = await personasApi.classifyAndSave(request);
        setClassifyResult(result);

        if (saveToDb && result.profileId) {
          setSuccessMessage('Classification saved to database');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClassifyLoading(false);
    }
  };

  // Load classification results
  const loadClassificationResults = async () => {
    setLoadingResults(true);
    try {
      const [logs, stats] = await Promise.all([
        personasApi.getClassificationResults({ limit: 50 }),
        personasApi.getClassificationStats(),
      ]);
      setClassificationLogs(logs);
      setClassificationStats(stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingResults(false);
    }
  };

  // Load results when switching to results tab
  useEffect(() => {
    if (activeTab === 'results') {
      loadClassificationResults();
    }
  }, [activeTab]);

  // Tab definitions
  const tabs = [
    { id: 'personas' as TabType, label: 'Personas', icon: ICONS.user },
    { id: 'bulk' as TabType, label: 'Bulk Create', icon: ICONS.copy },
    { id: 'classify' as TabType, label: 'Classification Tester', icon: ICONS.beaker },
    { id: 'results' as TabType, label: 'Classification Results', icon: ICONS.chart },
  ];

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.user} />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Persona Management</h1>
                <span
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                >
                  Admin
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Create, edit, and manage investment personas with their classification rules and insights.
              </p>
            </div>
          </div>
          {activeTab === 'personas' && (
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
              Add Persona
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'text-white' : ''
              }`}
              style={{
                background: activeTab === tab.id
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.chipBg,
                color: activeTab === tab.id ? 'white' : colors.textSecondary,
                border: `1px solid ${activeTab === tab.id ? 'transparent' : colors.chipBorder}`,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
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

        {/* Tab Content */}
        {activeTab === 'personas' && (
          <>
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderColor: colors.primary }}
                />
              </div>
            ) : (
              /* Personas Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => {
              const riskStyle = getRiskBandStyle(persona.riskBand);
              return (
                <div
                  key={persona.id}
                  className="p-5 rounded-xl transition-all hover:shadow-lg"
                  style={{
                    background: colors.cardBackground,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: `0 4px 24px ${colors.glassShadow}`
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: `linear-gradient(135deg, ${persona.colorPrimary}, ${persona.colorSecondary})` }}
                      >
                        {persona.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{persona.name}</h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                          style={{ background: riskStyle.bg, color: riskStyle.color }}
                        >
                          {persona.riskBand}
                        </span>
                      </div>
                    </div>
                    {/* Status Indicator */}
                    <div
                      className="flex items-center gap-1.5 px-2 py-1 rounded"
                      style={{ background: persona.isActive ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)') : colors.chipBg }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: persona.isActive ? colors.success : colors.textTertiary }}
                      />
                      <span className="text-xs" style={{ color: persona.isActive ? colors.success : colors.textTertiary }}>
                        {persona.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: colors.textSecondary }}>
                    {persona.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
                      style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.primary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.rules} />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                        {persona.rules?.length || 0} Rules
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1"
                      style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.primary }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.insights} />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                        {persona.insights?.length || 0} Insights
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(persona)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.edit} />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(persona.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all hover:opacity-80"
                      style={{ background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: colors.error }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.trash} />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {personas.length === 0 && !loading && (
              <div
                className="col-span-full p-12 rounded-xl text-center"
                style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
              >
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: colors.chipBg }}
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.textTertiary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.user} />
                  </svg>
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: colors.textPrimary }}>No Personas Yet</h3>
                <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>
                  Create your first investor persona to get started.
                </p>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                    boxShadow: `0 4px 14px ${colors.glassShadow}`
                  }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.plus} />
                  </svg>
                  Add Persona
                </button>
              </div>
            )}
          </div>
            )}
          </>
        )}

        {/* Bulk Create Tab */}
        {activeTab === 'bulk' && (
          <div
            className="p-6 rounded-xl"
            style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Bulk Create Personas</h2>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>Create multiple personas at once</p>
              </div>
              <button
                onClick={addBulkPersonaRow}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all hover:opacity-80"
                style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.plus} />
                </svg>
                Add Row
              </button>
            </div>

            <div className="space-y-4">
              {bulkPersonas.map((persona, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl"
                  style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
                      PERSONA {index + 1}
                    </span>
                    {bulkPersonas.length > 1 && (
                      <button
                        onClick={() => removeBulkPersonaRow(index)}
                        className="p-1.5 rounded-lg transition-all hover:opacity-70"
                        style={{ background: isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(239, 68, 68, 0.1)' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.error }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.trash} />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Name</label>
                      <input
                        type="text"
                        value={persona.name}
                        onChange={(e) => updateBulkPersona(index, 'name', e.target.value)}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        placeholder="Persona name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Slug</label>
                      <input
                        type="text"
                        value={persona.slug}
                        onChange={(e) => updateBulkPersona(index, 'slug', e.target.value)}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        placeholder="persona-slug"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Risk Band</label>
                      <select
                        value={persona.riskBand}
                        onChange={(e) => updateBulkPersona(index, 'riskBand', e.target.value)}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                      >
                        <option value="Capital Protection">Capital Protection</option>
                        <option value="Balanced Growth">Balanced Growth</option>
                        <option value="Accelerated Growth">Accelerated Growth</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Description</label>
                      <input
                        type="text"
                        value={persona.description}
                        onChange={(e) => updateBulkPersona(index, 'description', e.target.value)}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        placeholder="Brief description"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleBulkCreate}
                disabled={bulkLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                  boxShadow: `0 4px 14px ${colors.glassShadow}`
                }}
              >
                {bulkLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} />
                    </svg>
                    Create {bulkPersonas.filter(p => p.name && p.slug).length} Persona(s)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Classification Tester Tab */}
        {activeTab === 'classify' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <div
              className="p-6 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Profile Input</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>HORIZON YEARS</label>
                  <input
                    type="number"
                    value={classifyProfile.horizonYears}
                    onChange={(e) => setClassifyProfile({ ...classifyProfile, horizonYears: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>LIQUIDITY</label>
                    <select
                      value={classifyProfile.liquidity}
                      onChange={(e) => setClassifyProfile({ ...classifyProfile, liquidity: e.target.value })}
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>RISK TOLERANCE</label>
                    <select
                      value={classifyProfile.riskTolerance}
                      onChange={(e) => setClassifyProfile({ ...classifyProfile, riskTolerance: e.target.value })}
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Conservative">Conservative</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Aggressive">Aggressive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>VOLATILITY</label>
                    <select
                      value={classifyProfile.volatility}
                      onChange={(e) => setClassifyProfile({ ...classifyProfile, volatility: e.target.value })}
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>KNOWLEDGE</label>
                    <select
                      value={classifyProfile.knowledge}
                      onChange={(e) => setClassifyProfile({ ...classifyProfile, knowledge: e.target.value })}
                      className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: colors.chipBorder }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>Save to Database (Optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Name</label>
                      <input
                        type="text"
                        value={classifyUserData.name}
                        onChange={(e) => setClassifyUserData({ ...classifyUserData, name: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        placeholder="User name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: colors.textSecondary }}>Email</label>
                      <input
                        type="email"
                        value={classifyUserData.email}
                        onChange={(e) => setClassifyUserData({ ...classifyUserData, email: e.target.value })}
                        className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                        style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
                        placeholder="user@email.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Blended Mode Toggle */}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: colors.chipBorder }}>
                  <div>
                    <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Blended Classification</span>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>Shows weighted distribution across personas</p>
                  </div>
                  <button
                    onClick={() => setUseBlendedMode(!useBlendedMode)}
                    className="w-12 h-6 rounded-full transition-all relative"
                    style={{
                      background: useBlendedMode ? colors.primary : colors.chipBg,
                      border: `1px solid ${useBlendedMode ? colors.primary : colors.chipBorder}`
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                      style={{ left: useBlendedMode ? '24px' : '2px' }}
                    />
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleClassify(false)}
                    disabled={classifyLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.play} />
                    </svg>
                    Test Only
                  </button>
                  <button
                    onClick={() => handleClassify(true)}
                    disabled={classifyLoading || !classifyUserData.email}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                      boxShadow: `0 4px 14px ${colors.glassShadow}`
                    }}
                  >
                    {classifyLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICONS.check} />
                        </svg>
                        Classify & Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Result */}
            <div
              className="p-6 rounded-xl"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ color: colors.textPrimary }}>Classification Result</h2>

              {blendedResult ? (
                <div className="space-y-4">
                  {/* Primary Persona */}
                  <div
                    className="p-4 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.primaryDark}15)` }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>PRIMARY PERSONA</span>
                    <div className="flex items-center gap-4 mt-2">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})` }}
                      >
                        {blendedResult.primary_persona.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>{blendedResult.primary_persona.name}</h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                          style={{ background: getRiskBandStyle(blendedResult.primary_persona.risk_band).bg, color: getRiskBandStyle(blendedResult.primary_persona.risk_band).color }}
                        >
                          {blendedResult.primary_persona.risk_band}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Persona Distribution */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>PERSONA DISTRIBUTION</span>
                    <div className="space-y-2 mt-2">
                      {blendedResult.distribution.map((item) => (
                        <div key={item.persona.slug} className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>{item.persona.name}</span>
                            <span className="text-sm font-bold" style={{ color: colors.primary }}>{(item.weight * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.weight * 100}%`, background: colors.primary }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Blended Allocation */}
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>BLENDED ASSET ALLOCATION</span>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {Object.entries(blendedResult.blended_allocation).map(([key, value]) => (
                        <div key={key} className="p-2 rounded-xl text-center" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                          <p className="text-lg font-bold" style={{ color: colors.primary }}>{((value as number) * 100).toFixed(1)}%</p>
                          <p className="text-xs capitalize" style={{ color: colors.textSecondary }}>{key}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                      <span className="text-xs" style={{ color: colors.textTertiary }}>Confidence</span>
                      <p className="text-sm font-bold" style={{ color: colors.primary }}>{(blendedResult.confidence * 100).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                      <span className="text-xs" style={{ color: colors.textTertiary }}>Latency</span>
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{blendedResult.latency_ms}ms</p>
                    </div>
                    <div className="p-3 rounded-xl col-span-2" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                      <span className="text-xs" style={{ color: colors.textTertiary }}>Model Version</span>
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{blendedResult.model_version}</p>
                    </div>
                  </div>
                </div>
              ) : classifyResult ? (
                <div className="space-y-4">
                  {/* Persona Result */}
                  <div
                    className="p-4 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${classifyResult.persona.colorPrimary || colors.primary}15, ${classifyResult.persona.colorSecondary || colors.primaryDark}15)` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                        style={{ background: `linear-gradient(135deg, ${classifyResult.persona.colorPrimary || colors.primary}, ${classifyResult.persona.colorSecondary || colors.primaryDark})` }}
                      >
                        {classifyResult.persona.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>{classifyResult.persona.name}</h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded mt-1 inline-block"
                          style={{ background: getRiskBandStyle(classifyResult.persona.riskBand).bg, color: getRiskBandStyle(classifyResult.persona.riskBand).color }}
                        >
                          {classifyResult.persona.riskBand}
                        </span>
                      </div>
                    </div>
                    {classifyResult.persona.description && (
                      <p className="text-sm mt-3" style={{ color: colors.textSecondary }}>{classifyResult.persona.description}</p>
                    )}
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>CONFIDENCE</span>
                      <span className="text-lg font-bold" style={{ color: colors.primary }}>{(classifyResult.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${classifyResult.confidence * 100}%`, background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
                      />
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                      <span className="text-xs" style={{ color: colors.textTertiary }}>Method</span>
                      <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{classifyResult.method}</p>
                    </div>
                    {classifyResult.profileId && (
                      <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                        <span className="text-xs" style={{ color: colors.textTertiary }}>Profile ID</span>
                        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{classifyResult.profileId}</p>
                      </div>
                    )}
                    {classifyResult.inferenceLogId && (
                      <div className="p-3 rounded-xl" style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}>
                        <span className="text-xs" style={{ color: colors.textTertiary }}>Log ID</span>
                        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{classifyResult.inferenceLogId}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: colors.chipBg }}
                  >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: colors.textTertiary }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS.beaker} />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    Enter profile data and click "Test Only" or "Classify & Save" to see results
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Classification Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {classificationStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>TOTAL CLASSIFICATIONS</span>
                  <p className="text-2xl font-bold mt-1" style={{ color: colors.textPrimary }}>{classificationStats.totalClassifications}</p>
                </div>
                {classificationStats.personas.map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl"
                    style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>{p.name}</span>
                    <p className="text-2xl font-bold mt-1" style={{ color: colors.textPrimary }}>{p.userCount}</p>
                    <span className="text-xs" style={{ color: colors.textTertiary }}>users assigned</span>
                  </div>
                ))}
              </div>
            )}

            {/* Results Table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 24px ${colors.glassShadow}` }}
            >
              <div className="p-4 border-b" style={{ borderColor: colors.chipBorder }}>
                <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Recent Classifications</h2>
              </div>

              {loadingResults ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }} />
                </div>
              ) : classificationLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm" style={{ color: colors.textSecondary }}>No classification results yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: colors.chipBg }}>
                        <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Date</th>
                        <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>User</th>
                        <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Persona</th>
                        <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Confidence</th>
                        <th className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3" style={{ color: colors.primary }}>Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classificationLogs.map((log, index) => (
                        <tr
                          key={log.id}
                          style={{ borderBottom: index < classificationLogs.length - 1 ? `1px solid ${colors.chipBorder}` : undefined }}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm" style={{ color: colors.textPrimary }}>
                              {new Date(log.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs block" style={{ color: colors.textTertiary }}>
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <>
                                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                                  {log.user.profile?.name || 'Anonymous'}
                                </span>
                                <span className="text-xs block" style={{ color: colors.textTertiary }}>{log.user.email}</span>
                              </>
                            ) : (
                              <span className="text-sm" style={{ color: colors.textTertiary }}>Anonymous</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-xs px-2 py-1 rounded font-medium"
                              style={{ background: colors.chipBg, color: colors.primary, border: `1px solid ${colors.chipBorder}` }}
                            >
                              {log.prediction?.personaSlug || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold" style={{ color: colors.primary }}>
                              {(log.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm" style={{ color: colors.textSecondary }}>{log.latencyMs}ms</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isCreateMode ? 'Create Persona' : 'Edit Persona'}
        colors={colors}
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              NAME
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="e.g., Balanced Voyager"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              SLUG
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              placeholder="e.g., balanced-voyager"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              DESCRIPTION
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none resize-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
              rows={3}
              placeholder="Describe this persona..."
            />
          </div>

          {/* Risk Band */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
              RISK BAND
            </label>
            <select
              value={formData.riskBand}
              onChange={(e) => setFormData({ ...formData, riskBand: e.target.value })}
              className="w-full h-10 px-4 rounded-xl text-sm transition-all focus:outline-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
            >
              <option value="Capital Protection">Capital Protection</option>
              <option value="Balanced Growth">Balanced Growth</option>
              <option value="Accelerated Growth">Accelerated Growth</option>
            </select>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                PRIMARY COLOR
              </label>
              <div
                className="relative rounded-xl overflow-hidden"
                style={{ border: `1px solid ${colors.inputBorder}` }}
              >
                <input
                  type="color"
                  value={formData.colorPrimary}
                  onChange={(e) => setFormData({ ...formData, colorPrimary: e.target.value })}
                  className="w-full h-10 cursor-pointer border-0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: colors.primary }}>
                SECONDARY COLOR
              </label>
              <div
                className="relative rounded-xl overflow-hidden"
                style={{ border: `1px solid ${colors.inputBorder}` }}
              >
                <input
                  type="color"
                  value={formData.colorSecondary}
                  onChange={(e) => setFormData({ ...formData, colorSecondary: e.target.value })}
                  className="w-full h-10 cursor-pointer border-0"
                />
              </div>
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <div
              className="relative w-5 h-5 rounded flex items-center justify-center cursor-pointer"
              style={{
                background: formData.isActive ? colors.primary : 'transparent',
                border: `2px solid ${formData.isActive ? colors.primary : colors.inputBorder}`
              }}
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            >
              {formData.isActive && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <label
              className="text-sm cursor-pointer"
              style={{ color: colors.textPrimary }}
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            >
              Active Persona
            </label>
          </div>

          {/* Preview */}
          <div className="pt-2">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: colors.primary }}>
              PREVIEW
            </label>
            <div
              className="p-3 rounded-xl flex items-center gap-3"
              style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: `linear-gradient(135deg, ${formData.colorPrimary}, ${formData.colorSecondary})` }}
              >
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                  {formData.name || 'Persona Name'}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded ml-2"
                  style={{ background: getRiskBandStyle(formData.riskBand).bg, color: getRiskBandStyle(formData.riskBand).color }}
                >
                  {formData.riskBand}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-80"
              style={{ background: colors.chipBg, color: colors.textPrimary, border: `1px solid ${colors.chipBorder}` }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              {isCreateMode ? 'Create Persona' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PersonasPage;
