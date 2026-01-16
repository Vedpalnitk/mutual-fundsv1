import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

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

// Color type
type V4Colors = typeof V4_COLORS_LIGHT;

// Step Icons Component
const StepIcon = ({ icon, isActive, isCompleted, colors }: { icon: string; isActive: boolean; isCompleted: boolean; colors: V4Colors }) => {
  const iconColor = isActive ? '#FFFFFF' : isCompleted ? colors.success : colors.textTertiary;

  const icons: Record<string, JSX.Element> = {
    user: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={iconColor} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    wallet: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={iconColor} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
    ),
    chart: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={iconColor} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    target: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={iconColor} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01" />
      </svg>
    ),
    shield: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={iconColor} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    check: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={iconColor} strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return icons[icon] || null;
};

// Input Field Component
const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  prefix = '',
  suffix = '',
  required = false,
  helpText = '',
  colors
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  required?: boolean;
  helpText?: string;
  colors: V4Colors;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
      {label} {required && <span style={{ color: colors.error }}>*</span>}
    </label>
    <div className="relative">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: colors.textSecondary }}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 rounded-xl text-sm transition-all focus:outline-none"
        style={{
          background: colors.inputBg,
          border: `1px solid ${colors.inputBorder}`,
          color: colors.textPrimary,
          paddingLeft: prefix ? '2.5rem' : '1rem',
          paddingRight: suffix ? '3rem' : '1rem'
        }}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: colors.textSecondary }}>
          {suffix}
        </span>
      )}
    </div>
    {helpText && (
      <p className="text-xs" style={{ color: colors.textTertiary }}>{helpText}</p>
    )}
  </div>
);

// Select Field Component
const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false,
  helpText = '',
  colors
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  helpText?: string;
  colors: V4Colors;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
      {label} {required && <span style={{ color: colors.error }}>*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-11 px-4 rounded-xl text-sm transition-all focus:outline-none"
      style={{ background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, color: colors.textPrimary }}
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {helpText && (
      <p className="text-xs" style={{ color: colors.textTertiary }}>{helpText}</p>
    )}
  </div>
);

// Toggle Card Component
const ToggleCard = ({
  label,
  description,
  checked,
  onChange,
  colors
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  colors: V4Colors;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="w-full p-4 rounded-2xl text-left transition-all"
    style={{
      background: checked
        ? `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.primaryDark}10 100%)`
        : colors.inputBg,
      border: `2px solid ${checked ? colors.primary : colors.inputBorder}`,
    }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{description}</p>
        )}
      </div>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: checked ? colors.primary : 'transparent',
          border: `2px solid ${checked ? colors.primary : colors.inputBorder}`,
        }}
      >
        {checked && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  </button>
);

// Option Card Component
const OptionCard = ({
  label,
  description,
  icon,
  selected,
  onClick,
  colors,
  isDark
}: {
  label: string;
  description?: string;
  icon?: JSX.Element;
  selected: boolean;
  onClick: () => void;
  colors: V4Colors;
  isDark: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full p-4 rounded-2xl text-left transition-all hover:-translate-y-0.5"
    style={{
      background: selected
        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
        : colors.cardBackground,
      border: `1px solid ${selected ? 'transparent' : colors.cardBorder}`,
      boxShadow: selected ? `0 8px 24px ${isDark ? 'rgba(96, 165, 250, 0.25)' : 'rgba(37, 99, 235, 0.2)'}` : 'none'
    }}
  >
    <div className="flex items-start gap-3">
      {icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: selected ? 'rgba(255,255,255,0.2)' : colors.chipBg }}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold" style={{ color: selected ? '#FFFFFF' : colors.textPrimary }}>{label}</p>
        {description && (
          <p className="text-xs mt-1" style={{ color: selected ? 'rgba(255,255,255,0.8)' : colors.textSecondary }}>{description}</p>
        )}
      </div>
    </div>
  </button>
);

// Slider Input Component
const SliderInput = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  helpText,
  colors
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (val: number) => string;
  helpText?: string;
  colors: V4Colors;
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
        {label}
      </label>
      <span className="text-lg font-bold" style={{ color: colors.textPrimary }}>
        {formatValue ? formatValue(value) : value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 rounded-full appearance-none cursor-pointer"
      style={{
        background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${((value - min) / (max - min)) * 100}%, ${colors.progressBg} ${((value - min) / (max - min)) * 100}%, ${colors.progressBg} 100%)`,
      }}
    />
    <div className="flex justify-between text-xs" style={{ color: colors.textTertiary }}>
      <span>{formatValue ? formatValue(min) : min}</span>
      <span>{formatValue ? formatValue(max) : max}</span>
    </div>
    {helpText && <p className="text-xs" style={{ color: colors.textTertiary }}>{helpText}</p>}
  </div>
);

// Types for the onboarding data
type OnboardingData = {
  // Step 1: Identity & Verification
  fullName: string;
  email: string;
  phone: string;
  pan: string;
  aadhaar: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed' | '';
  city: string;
  occupation: string;
  employmentType: 'Salaried' | 'Self-Employed' | 'Business' | 'Retired' | 'Student' | '';

  // Step 2: Financial Health
  monthlyIncome: number;
  monthlyExpenses: number;
  existingSavings: number;
  emergencyFundMonths: number;
  hasLoans: boolean;
  totalEmi: number;
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  dependents: number;

  // Step 3: Investment Experience
  investmentExperience: 'None' | 'Less than 1 year' | '1-3 years' | '3-5 years' | '5+ years' | '';
  currentInvestments: {
    mutualFunds: boolean;
    stocks: boolean;
    fixedDeposits: boolean;
    ppf: boolean;
    nps: boolean;
    realEstate: boolean;
    gold: boolean;
    crypto: boolean;
  };
  investmentKnowledge: 'Beginner' | 'Intermediate' | 'Advanced' | '';
  previousLosses: boolean;
  lossReaction: 'Panic sold' | 'Held and waited' | 'Bought more' | 'Never experienced' | '';

  // Step 4: Goal Planning
  primaryGoal: 'Retirement' | 'Wealth Creation' | 'Child Education' | 'House Purchase' | 'Emergency Fund' | 'Tax Saving' | 'Other' | '';
  primaryGoalAmount: number;
  primaryGoalYears: number;
  hasSecondaryGoal: boolean;
  secondaryGoal: string;
  secondaryGoalAmount: number;
  secondaryGoalYears: number;
  monthlyInvestmentCapacity: number;
  lumpSumAvailable: number;
  investmentFrequency: 'Monthly SIP' | 'Quarterly' | 'Lump Sum' | 'Mix of both' | '';

  // Step 5: Risk Profiling
  riskAppetite: 'Very Conservative' | 'Conservative' | 'Moderate' | 'Aggressive' | 'Very Aggressive' | '';
  marketDropReaction: 'Sell everything' | 'Sell some' | 'Do nothing' | 'Buy more' | '';
  preferredReturns: 'Steady 8-10%' | 'Moderate 12-15%' | 'High 18-22%' | 'Maximum possible' | '';
  investmentPriority: 'Capital protection' | 'Regular income' | 'Long-term growth' | 'Tax saving' | '';
  drawdownTolerance: '5%' | '10%' | '20%' | '30%+' | '';
  volatilityComfort: 'Low' | 'Medium' | 'High' | '';

  // Step 6: Preferences
  taxSavingPriority: 'High' | 'Medium' | 'Low' | '';
  esgPreference: boolean;
  directOrRegular: 'Direct' | 'Regular' | 'No preference' | '';
  communicationPreference: 'Email' | 'SMS' | 'WhatsApp' | 'All' | '';
};

const initialData: OnboardingData = {
  fullName: '',
  email: '',
  phone: '',
  pan: '',
  aadhaar: '',
  dateOfBirth: '',
  gender: '',
  maritalStatus: '',
  city: '',
  occupation: '',
  employmentType: '',
  monthlyIncome: 0,
  monthlyExpenses: 0,
  existingSavings: 0,
  emergencyFundMonths: 0,
  hasLoans: false,
  totalEmi: 0,
  hasHealthInsurance: false,
  hasLifeInsurance: false,
  dependents: 0,
  investmentExperience: '',
  currentInvestments: {
    mutualFunds: false,
    stocks: false,
    fixedDeposits: false,
    ppf: false,
    nps: false,
    realEstate: false,
    gold: false,
    crypto: false,
  },
  investmentKnowledge: '',
  previousLosses: false,
  lossReaction: '',
  primaryGoal: '',
  primaryGoalAmount: 0,
  primaryGoalYears: 0,
  hasSecondaryGoal: false,
  secondaryGoal: '',
  secondaryGoalAmount: 0,
  secondaryGoalYears: 0,
  monthlyInvestmentCapacity: 0,
  lumpSumAvailable: 0,
  investmentFrequency: '',
  riskAppetite: '',
  marketDropReaction: '',
  preferredReturns: '',
  investmentPriority: '',
  drawdownTolerance: '',
  volatilityComfort: '',
  taxSavingPriority: '',
  esgPreference: false,
  directOrRegular: '',
  communicationPreference: '',
};

const steps = [
  { id: 1, name: 'Identity', icon: 'user', description: 'KYC & Verification' },
  { id: 2, name: 'Financial Health', icon: 'wallet', description: 'Income & Savings' },
  { id: 3, name: 'Experience', icon: 'chart', description: 'Investment Background' },
  { id: 4, name: 'Goals', icon: 'target', description: 'What you want to achieve' },
  { id: 5, name: 'Risk Profile', icon: 'shield', description: 'Your comfort with risk' },
  { id: 6, name: 'Review', icon: 'check', description: 'Confirm & Get Started' },
];

export default function OnboardingPage() {
  const isDark = useDarkMode();
  const colors = useV4Colors();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedPersona, setAssignedPersona] = useState<string | null>(null);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const calculatePersona = () => {
    // AI Persona assignment logic based on inputs
    let score = 0;

    // Age factor (younger = higher risk capacity)
    const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
    if (age < 30) score += 3;
    else if (age < 40) score += 2;
    else if (age < 50) score += 1;

    // Income stability
    if (data.employmentType === 'Salaried') score += 2;
    if (data.employmentType === 'Business') score += 1;

    // Financial cushion
    if (data.emergencyFundMonths >= 6) score += 2;
    if (!data.hasLoans || data.totalEmi < data.monthlyIncome * 0.3) score += 1;

    // Experience
    if (data.investmentExperience === '5+ years') score += 2;
    if (data.investmentExperience === '3-5 years') score += 1;

    // Risk appetite
    if (data.riskAppetite === 'Very Aggressive') score += 3;
    if (data.riskAppetite === 'Aggressive') score += 2;
    if (data.riskAppetite === 'Moderate') score += 1;

    // Goal horizon
    if (data.primaryGoalYears >= 10) score += 2;
    else if (data.primaryGoalYears >= 5) score += 1;

    // Determine persona
    if (score >= 12) return 'Accelerated Builder';
    if (score >= 7) return 'Balanced Voyager';
    return 'Capital Guardian';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    const persona = calculatePersona();
    setAssignedPersona(persona);
    setIsSubmitting(false);
  };

  
  // Step Content Renderers
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Let's get to know you</h2>
        <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
          We need some basic details for KYC compliance as per SEBI regulations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          colors={colors}
          label="Full Name (as per PAN)"
          value={data.fullName}
          onChange={(v) => updateData({ fullName: v })}
          placeholder="Enter your full name"
          required
        />
        <InputField
          colors={colors}
          label="Date of Birth"
          value={data.dateOfBirth}
          onChange={(v) => updateData({ dateOfBirth: v })}
          type="date"
          required
        />
        <InputField
          colors={colors}
          label="PAN Number"
          value={data.pan}
          onChange={(v) => updateData({ pan: v.toUpperCase() })}
          placeholder="ABCDE1234F"
          required
          helpText="10-character alphanumeric"
        />
        <InputField
          colors={colors}
          label="Aadhaar Number"
          value={data.aadhaar}
          onChange={(v) => updateData({ aadhaar: v })}
          placeholder="1234 5678 9012"
          required
          helpText="12-digit Aadhaar number"
        />
        <InputField
          colors={colors}
          label="Email Address"
          value={data.email}
          onChange={(v) => updateData({ email: v })}
          type="email"
          placeholder="you@example.com"
          required
        />
        <InputField
          colors={colors}
          label="Mobile Number"
          value={data.phone}
          onChange={(v) => updateData({ phone: v })}
          type="tel"
          placeholder="9876543210"
          prefix="+91"
          required
        />
        <SelectField
          colors={colors}
          label="Gender"
          value={data.gender}
          onChange={(v) => updateData({ gender: v as OnboardingData['gender'] })}
          options={[
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Other', label: 'Other' },
          ]}
          required
        />
        <SelectField
          colors={colors}
          label="Marital Status"
          value={data.maritalStatus}
          onChange={(v) => updateData({ maritalStatus: v as OnboardingData['maritalStatus'] })}
          options={[
            { value: 'Single', label: 'Single' },
            { value: 'Married', label: 'Married' },
            { value: 'Divorced', label: 'Divorced' },
            { value: 'Widowed', label: 'Widowed' },
          ]}
        />
        <InputField
          colors={colors}
          label="City"
          value={data.city}
          onChange={(v) => updateData({ city: v })}
          placeholder="e.g., Mumbai"
          required
        />
        <InputField
          colors={colors}
          label="Occupation"
          value={data.occupation}
          onChange={(v) => updateData({ occupation: v })}
          placeholder="e.g., Software Engineer"
          required
        />
      </div>

      <SelectField
        colors={colors}
        label="Employment Type"
        value={data.employmentType}
        onChange={(v) => updateData({ employmentType: v as OnboardingData['employmentType'] })}
        options={[
          { value: 'Salaried', label: 'Salaried Employee' },
          { value: 'Self-Employed', label: 'Self-Employed / Freelancer' },
          { value: 'Business', label: 'Business Owner' },
          { value: 'Retired', label: 'Retired' },
          { value: 'Student', label: 'Student' },
        ]}
        required
      />

      <div
        className="p-4 rounded-xl flex items-start gap-3"
        style={{
          background: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.06)',
          border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)'}`
        }}
      >
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <div>
          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Your data is secure</p>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            We use bank-grade encryption and comply with SEBI's KYC guidelines. Your information is verified through KRA and never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Your Financial Health</h2>
        <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
          Understanding your current financial situation helps us recommend the right investments.
        </p>
      </div>

      <div
        className="p-5 rounded-xl space-y-5"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Monthly Cash Flow</h3>

        <SliderInput
          colors={colors}
          label="Monthly Income (Take-home)"
          value={data.monthlyIncome}
          onChange={(v) => updateData({ monthlyIncome: v })}
          min={25000}
          max={1000000}
          step={5000}
          formatValue={(v) => `₹${(v/1000).toFixed(0)}K`}
          helpText="After tax deductions"
        />

        <SliderInput
          colors={colors}
          label="Monthly Expenses"
          value={data.monthlyExpenses}
          onChange={(v) => updateData({ monthlyExpenses: v })}
          min={10000}
          max={500000}
          step={5000}
          formatValue={(v) => `₹${(v/1000).toFixed(0)}K`}
          helpText="Rent, bills, groceries, EMIs, lifestyle"
        />

        {data.monthlyIncome > 0 && data.monthlyExpenses > 0 && (
          <div
            className="p-4 rounded-xl"
            style={{
              background: data.monthlyIncome - data.monthlyExpenses > 0
                ? (isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.08)')
                : (isDark ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.08)'),
              border: `1px solid ${data.monthlyIncome - data.monthlyExpenses > 0
                ? (isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)')
                : (isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.15)')}`
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: colors.textSecondary }}>Monthly Surplus</span>
              <span className="text-lg font-bold" style={{
                color: data.monthlyIncome - data.monthlyExpenses > 0 ? colors.success : colors.error
              }}>
                ₹{((data.monthlyIncome - data.monthlyExpenses)/1000).toFixed(0)}K
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className="p-5 rounded-xl space-y-5"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Savings & Safety Net</h3>

        <SliderInput
          colors={colors}
          label="Existing Savings & Investments"
          value={data.existingSavings}
          onChange={(v) => updateData({ existingSavings: v })}
          min={0}
          max={10000000}
          step={50000}
          formatValue={(v) => v >= 10000000 ? '₹1Cr+' : `₹${(v/100000).toFixed(1)}L`}
          helpText="FDs, MFs, Stocks, PPF, NPS combined"
        />

        <SelectField
          colors={colors}
          label="Emergency Fund Coverage"
          value={String(data.emergencyFundMonths)}
          onChange={(v) => updateData({ emergencyFundMonths: Number(v) })}
          options={[
            { value: '0', label: 'No emergency fund' },
            { value: '3', label: '1-3 months of expenses' },
            { value: '6', label: '3-6 months of expenses' },
            { value: '12', label: '6-12 months of expenses' },
            { value: '24', label: '12+ months of expenses' },
          ]}
          helpText="Liquid savings for unexpected expenses"
        />

        <InputField
          colors={colors}
          label="Number of Dependents"
          value={data.dependents}
          onChange={(v) => updateData({ dependents: Number(v) })}
          type="number"
          placeholder="0"
          helpText="Spouse, children, parents financially dependent on you"
        />
      </div>

      <div
        className="p-5 rounded-xl space-y-5"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Liabilities & Protection</h3>

        <ToggleCard
          colors={colors}
          label="Do you have active loans/EMIs?"
          description="Home loan, car loan, personal loan, credit card debt"
          checked={data.hasLoans}
          onChange={(v) => updateData({ hasLoans: v })}
        />

        {data.hasLoans && (
          <SliderInput
            colors={colors}
            label="Total Monthly EMI"
            value={data.totalEmi}
            onChange={(v) => updateData({ totalEmi: v })}
            min={0}
            max={200000}
            step={1000}
            formatValue={(v) => `₹${(v/1000).toFixed(0)}K`}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <ToggleCard
            colors={colors}
            label="Health Insurance"
            checked={data.hasHealthInsurance}
            onChange={(v) => updateData({ hasHealthInsurance: v })}
          />
          <ToggleCard
            colors={colors}
            label="Life Insurance"
            checked={data.hasLifeInsurance}
            onChange={(v) => updateData({ hasLifeInsurance: v })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Your Investment Experience</h2>
        <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
          Tell us about your investing journey so far.
        </p>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Experience Level</h3>

        <div className="grid grid-cols-1 gap-3">
          {[
            { value: 'None', label: 'New to Investing', desc: 'I have never invested before' },
            { value: 'Less than 1 year', label: 'Beginner', desc: 'Started investing recently' },
            { value: '1-3 years', label: 'Intermediate', desc: 'Have some experience with markets' },
            { value: '3-5 years', label: 'Experienced', desc: 'Comfortable with different instruments' },
            { value: '5+ years', label: 'Expert', desc: 'Deep understanding of markets' },
          ].map(opt => (
            <OptionCard
              key={opt.value}
              colors={colors}
              isDark={isDark}
              label={opt.label}
              description={opt.desc}
              selected={data.investmentExperience === opt.value}
              onClick={() => updateData({ investmentExperience: opt.value as OnboardingData['investmentExperience'] })}
            />
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Current Investments</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>Select all that apply</p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'mutualFunds', label: 'Mutual Funds' },
            { key: 'stocks', label: 'Direct Stocks' },
            { key: 'fixedDeposits', label: 'Fixed Deposits' },
            { key: 'ppf', label: 'PPF / EPF' },
            { key: 'nps', label: 'NPS' },
            { key: 'realEstate', label: 'Real Estate' },
            { key: 'gold', label: 'Gold / SGBs' },
            { key: 'crypto', label: 'Crypto' },
          ].map(item => (
            <ToggleCard
              key={item.key}
              colors={colors}
              label={item.label}
              checked={data.currentInvestments[item.key as keyof typeof data.currentInvestments]}
              onChange={(v) => updateData({
                currentInvestments: { ...data.currentInvestments, [item.key]: v }
              })}
            />
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Market Behavior</h3>

        <SelectField
          colors={colors}
          label="Investment Knowledge Self-Assessment"
          value={data.investmentKnowledge}
          onChange={(v) => updateData({ investmentKnowledge: v as OnboardingData['investmentKnowledge'] })}
          options={[
            { value: 'Beginner', label: 'Beginner - Still learning basics' },
            { value: 'Intermediate', label: 'Intermediate - Understand risk-return' },
            { value: 'Advanced', label: 'Advanced - Can analyze funds independently' },
          ]}
        />

        <ToggleCard
          colors={colors}
          label="Have you experienced investment losses?"
          description="Actual realized or unrealized losses in any investment"
          checked={data.previousLosses}
          onChange={(v) => updateData({ previousLosses: v })}
        />

        {data.previousLosses && (
          <SelectField
            colors={colors}
            label="How did you react to losses?"
            value={data.lossReaction}
            onChange={(v) => updateData({ lossReaction: v as OnboardingData['lossReaction'] })}
            options={[
              { value: 'Panic sold', label: 'Sold immediately to cut losses' },
              { value: 'Held and waited', label: 'Held and waited for recovery' },
              { value: 'Bought more', label: 'Bought more at lower prices' },
            ]}
          />
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Your Investment Goals</h2>
        <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
          What are you investing for? Clear goals help us build the right portfolio.
        </p>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Primary Goal</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { value: 'Retirement', label: 'Retirement', icon: '🏖️' },
            { value: 'Wealth Creation', label: 'Wealth Creation', icon: '📈' },
            { value: 'Child Education', label: 'Child Education', icon: '🎓' },
            { value: 'House Purchase', label: 'House Purchase', icon: '🏠' },
            { value: 'Emergency Fund', label: 'Emergency Fund', icon: '🛡️' },
            { value: 'Tax Saving', label: 'Tax Saving', icon: '💰' },
          ].map(goal => (
            <button
              key={goal.value}
              onClick={() => updateData({ primaryGoal: goal.value as OnboardingData['primaryGoal'] })}
              className="p-4 rounded-2xl text-center transition-all hover:-translate-y-0.5"
              style={{
                background: data.primaryGoal === goal.value
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.inputBg,
                border: `1px solid ${data.primaryGoal === goal.value ? 'transparent' : colors.inputBorder}`,
              }}
            >
              <span className="text-2xl block mb-2">{goal.icon}</span>
              <span
                className="text-sm font-medium"
                style={{ color: data.primaryGoal === goal.value ? '#FFFFFF' : colors.textPrimary }}
              >
                {goal.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {data.primaryGoal && (
        <div
          className="p-5 rounded-xl space-y-5"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
            {data.primaryGoal} Details
          </h3>

          <SliderInput
            colors={colors}
            label="Target Amount"
            value={data.primaryGoalAmount}
            onChange={(v) => updateData({ primaryGoalAmount: v })}
            min={100000}
            max={50000000}
            step={100000}
            formatValue={(v) => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : `₹${(v/100000).toFixed(0)}L`}
            helpText="How much do you need for this goal?"
          />

          <SliderInput
            colors={colors}
            label="Time Horizon"
            value={data.primaryGoalYears}
            onChange={(v) => updateData({ primaryGoalYears: v })}
            min={1}
            max={30}
            step={1}
            formatValue={(v) => `${v} years`}
            helpText="When do you need this money?"
          />

          {data.primaryGoalAmount > 0 && data.primaryGoalYears > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.06)',
                border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)'}`
              }}
            >
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: colors.primary }}>
                Estimated Monthly SIP Needed
              </p>
              <p className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                ₹{Math.round(data.primaryGoalAmount / (data.primaryGoalYears * 12 * 1.5) / 100) * 100}
              </p>
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                Assuming 12% annual returns (approximate)
              </p>
            </div>
          )}
        </div>
      )}

      <ToggleCard
        colors={colors}
        label="I have a secondary goal"
        description="Add another financial goal you're working towards"
        checked={data.hasSecondaryGoal}
        onChange={(v) => updateData({ hasSecondaryGoal: v })}
      />

      {data.hasSecondaryGoal && (
        <div
          className="p-5 rounded-xl space-y-4"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Secondary Goal</h3>
          <InputField
            colors={colors}
            label="Goal Name"
            value={data.secondaryGoal}
            onChange={(v) => updateData({ secondaryGoal: v })}
            placeholder="e.g., Car purchase, Vacation, Wedding"
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              colors={colors}
              label="Target Amount"
              value={data.secondaryGoalAmount}
              onChange={(v) => updateData({ secondaryGoalAmount: Number(v) })}
              type="number"
              prefix="₹"
            />
            <InputField
              colors={colors}
              label="Years"
              value={data.secondaryGoalYears}
              onChange={(v) => updateData({ secondaryGoalYears: Number(v) })}
              type="number"
              suffix="yrs"
            />
          </div>
        </div>
      )}

      <div
        className="p-5 rounded-xl space-y-5"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Investment Capacity</h3>

        <SliderInput
          colors={colors}
          label="Monthly Investment Capacity"
          value={data.monthlyInvestmentCapacity}
          onChange={(v) => updateData({ monthlyInvestmentCapacity: v })}
          min={1000}
          max={200000}
          step={1000}
          formatValue={(v) => `₹${(v/1000).toFixed(0)}K`}
          helpText="How much can you invest every month?"
        />

        <SliderInput
          colors={colors}
          label="Lump Sum Available"
          value={data.lumpSumAvailable}
          onChange={(v) => updateData({ lumpSumAvailable: v })}
          min={0}
          max={5000000}
          step={25000}
          formatValue={(v) => v === 0 ? 'None' : `₹${(v/100000).toFixed(1)}L`}
          helpText="One-time amount you can invest now"
        />

        <SelectField
          colors={colors}
          label="Preferred Investment Style"
          value={data.investmentFrequency}
          onChange={(v) => updateData({ investmentFrequency: v as OnboardingData['investmentFrequency'] })}
          options={[
            { value: 'Monthly SIP', label: 'Monthly SIP - Disciplined investing' },
            { value: 'Quarterly', label: 'Quarterly - After bonus/incentives' },
            { value: 'Lump Sum', label: 'Lump Sum - Invest when I have surplus' },
            { value: 'Mix of both', label: 'Mix of SIP + occasional lump sum' },
          ]}
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
        >
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Risk Profile Assessment</h2>
        <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
          Understanding your comfort with risk helps us recommend the right mix.
        </p>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Risk Appetite</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>How would you describe your approach to investing?</p>

        <div className="space-y-3">
          {[
            { value: 'Very Conservative', label: 'Very Conservative', desc: 'I want to protect my capital at all costs, even if returns are low' },
            { value: 'Conservative', label: 'Conservative', desc: 'I prefer stability with some growth, minimal fluctuations' },
            { value: 'Moderate', label: 'Moderate', desc: 'I can handle some ups and downs for better returns' },
            { value: 'Aggressive', label: 'Aggressive', desc: 'I am comfortable with significant volatility for higher growth' },
            { value: 'Very Aggressive', label: 'Very Aggressive', desc: 'I want maximum growth and can handle large swings' },
          ].map(opt => (
            <OptionCard
              key={opt.value}
              colors={colors}
              isDark={isDark}
              label={opt.label}
              description={opt.desc}
              selected={data.riskAppetite === opt.value}
              onClick={() => updateData({ riskAppetite: opt.value as OnboardingData['riskAppetite'] })}
            />
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Scenario: Market Drops 20%</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Imagine your portfolio drops 20% in a month due to market correction. What would you do?
        </p>

        <div className="space-y-3">
          {[
            { value: 'Sell everything', label: 'Sell Everything', desc: 'Exit completely to prevent further losses', color: colors.error },
            { value: 'Sell some', label: 'Sell Some', desc: 'Reduce exposure partially', color: colors.warning },
            { value: 'Do nothing', label: 'Stay Put', desc: 'Hold and wait for recovery', color: colors.textSecondary },
            { value: 'Buy more', label: 'Buy More', desc: 'See it as an opportunity to invest more', color: colors.success },
          ].map(opt => (
            <OptionCard
              key={opt.value}
              colors={colors}
              isDark={isDark}
              label={opt.label}
              description={opt.desc}
              selected={data.marketDropReaction === opt.value}
              onClick={() => updateData({ marketDropReaction: opt.value as OnboardingData['marketDropReaction'] })}
            />
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Return Expectations</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>What annual returns do you expect from your investments?</p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'Steady 8-10%', label: '8-10% p.a.', desc: 'Low risk, steady growth' },
            { value: 'Moderate 12-15%', label: '12-15% p.a.', desc: 'Balanced risk-return' },
            { value: 'High 18-22%', label: '18-22% p.a.', desc: 'Higher risk, higher potential' },
            { value: 'Maximum possible', label: 'Maximum', desc: 'Willing to take high risk' },
          ].map(opt => (
            <OptionCard
              key={opt.value}
              colors={colors}
              isDark={isDark}
              label={opt.label}
              description={opt.desc}
              selected={data.preferredReturns === opt.value}
              onClick={() => updateData({ preferredReturns: opt.value as OnboardingData['preferredReturns'] })}
            />
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Maximum Acceptable Loss</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          What is the maximum temporary loss you can tolerate before you would want to exit?
        </p>

        <div className="grid grid-cols-4 gap-3">
          {['5%', '10%', '20%', '30%+'].map(val => (
            <button
              key={val}
              onClick={() => updateData({ drawdownTolerance: val as OnboardingData['drawdownTolerance'] })}
              className="p-4 rounded-xl text-center transition-all"
              style={{
                background: data.drawdownTolerance === val
                  ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                  : colors.inputBg,
                border: `1px solid ${data.drawdownTolerance === val ? 'transparent' : colors.inputBorder}`,
              }}
            >
              <span
                className="text-lg font-bold"
                style={{ color: data.drawdownTolerance === val ? '#FFFFFF' : colors.textPrimary }}
              >
                {val}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="p-5 rounded-xl space-y-4"
        style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>Investment Priority</h3>

        <div className="space-y-3">
          {[
            { value: 'Capital protection', label: 'Capital Protection', desc: 'Preserve my initial investment' },
            { value: 'Regular income', label: 'Regular Income', desc: 'Generate periodic returns' },
            { value: 'Long-term growth', label: 'Long-term Growth', desc: 'Maximize wealth over time' },
            { value: 'Tax saving', label: 'Tax Optimization', desc: 'Minimize tax liability' },
          ].map(opt => (
            <OptionCard
              key={opt.value}
              colors={colors}
              isDark={isDark}
              label={opt.label}
              description={opt.desc}
              selected={data.investmentPriority === opt.value}
              onClick={() => updateData({ investmentPriority: opt.value as OnboardingData['investmentPriority'] })}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => {
    const persona = calculatePersona();
    const personaDetails = {
      'Accelerated Builder': {
        color: '#10B981',
        allocation: { equity: 75, debt: 15, hybrid: 7, alternatives: 3 },
        description: 'Long horizon, high income stability, and strong volatility tolerance place you in an aggressive growth band with equity-heavy bias.',
        traits: ['High risk capacity', 'Long time horizon', 'Growth focused', 'Volatility tolerant']
      },
      'Balanced Voyager': {
        color: '#3B82F6',
        allocation: { equity: 55, debt: 30, hybrid: 10, alternatives: 5 },
        description: 'Mid-term goals with steady cash flow. Balanced across equity and debt to smooth volatility while capturing growth.',
        traits: ['Moderate risk', 'Balanced approach', 'Steady growth', 'Diversified']
      },
      'Capital Guardian': {
        color: '#F59E0B',
        allocation: { equity: 35, debt: 50, hybrid: 10, alternatives: 5 },
        description: 'Shorter horizon with focus on capital stability and drawdown protection. Prioritizes preservation over aggressive growth.',
        traits: ['Capital preservation', 'Low volatility', 'Stable returns', 'Risk averse']
      }
    };

    const details = personaDetails[persona as keyof typeof personaDetails];

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${details.color} 0%, ${details.color}CC 100%)` }}
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Your Investor Profile</h2>
          <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
            Based on your inputs, we've determined your ideal investment persona.
          </p>
        </div>

        {/* Persona Card */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${details.color}20 0%, ${details.color}10 100%)`,
            border: `2px solid ${details.color}40`
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${details.color} 0%, ${details.color}CC 100%)` }}
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{persona}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${details.color}30`, color: details.color }}
                >
                  AI Assigned
                </span>
              </div>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{details.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {details.traits.map(trait => (
                  <span
                    key={trait}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: colors.chipBg, color: colors.textPrimary }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Allocation */}
        <div
          className="p-5 rounded-xl"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Recommended Asset Allocation
          </h3>
          <div className="space-y-3">
            {Object.entries(details.allocation).map(([asset, percent]) => (
              <div key={asset} className="flex items-center gap-3">
                <span className="text-sm w-24 capitalize" style={{ color: colors.textSecondary }}>{asset}</span>
                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: colors.progressBg }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      background: asset === 'equity' ? colors.primary
                        : asset === 'debt' ? colors.success
                        : asset === 'hybrid' ? colors.warning
                        : colors.textTertiary
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-12 text-right" style={{ color: colors.textPrimary }}>{percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div
          className="p-5 rounded-xl"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: colors.primary }}>
            Profile Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Name', value: data.fullName },
              { label: 'Primary Goal', value: data.primaryGoal },
              { label: 'Target', value: `₹${(data.primaryGoalAmount/100000).toFixed(0)}L in ${data.primaryGoalYears} yrs` },
              { label: 'Monthly SIP', value: `₹${(data.monthlyInvestmentCapacity/1000).toFixed(0)}K` },
              { label: 'Risk Profile', value: data.riskAppetite },
              { label: 'Experience', value: data.investmentExperience },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl" style={{ background: colors.chipBg }}>
                <p className="text-xs" style={{ color: colors.textTertiary }}>{item.label}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: colors.textPrimary }}>{item.value || '-'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div
          className="p-5 rounded-xl space-y-4"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.primary }}>
            Additional Preferences
          </h3>

          <SelectField
            colors={colors}
            label="Tax Saving Priority"
            value={data.taxSavingPriority}
            onChange={(v) => updateData({ taxSavingPriority: v as OnboardingData['taxSavingPriority'] })}
            options={[
              { value: 'High', label: 'High - Maximize 80C benefits' },
              { value: 'Medium', label: 'Medium - Some tax optimization' },
              { value: 'Low', label: 'Low - Growth over tax saving' },
            ]}
          />

          <SelectField
            colors={colors}
            label="Fund Type Preference"
            value={data.directOrRegular}
            onChange={(v) => updateData({ directOrRegular: v as OnboardingData['directOrRegular'] })}
            options={[
              { value: 'Direct', label: 'Direct Plans - Lower expense ratio' },
              { value: 'Regular', label: 'Regular Plans - With advisor support' },
              { value: 'No preference', label: 'No preference' },
            ]}
          />

          <ToggleCard
            colors={colors}
            label="ESG Preference"
            description="Prefer environmentally and socially responsible funds"
            checked={data.esgPreference}
            onChange={(v) => updateData({ esgPreference: v })}
          />
        </div>

        {/* Terms */}
        <div
          className="p-4 rounded-xl"
          style={{
            background: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.06)',
            border: `1px solid ${isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)'}`
          }}
        >
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            By clicking "Complete Setup", you agree to our Terms of Service and Privacy Policy.
            Your KYC details will be verified through SEBI-registered KRA.
            Investment recommendations are based on your profile and are subject to market risks.
          </p>
        </div>
      </div>
    );
  };

  // Success Screen
  if (assignedPersona) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: colors.background }}>
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center"
          style={{ background: colors.cardBackground, border: `1px solid ${colors.cardBorder}` }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}CC 100%)` }}
          >
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary }}>Welcome aboard!</h2>
          <p className="text-sm mb-6" style={{ color: colors.textSecondary }}>
            Your profile has been created successfully. You've been assigned the <strong>{assignedPersona}</strong> persona.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-full font-semibold text-white transition-all hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
              boxShadow: `0 4px 14px ${colors.glassShadow}`
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4"
        style={{
          background: colors.cardBackground,
          borderBottom: `1px solid ${colors.cardBorder}`,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)` }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Sparrow Invest</p>
              <p className="text-xs" style={{ color: colors.textSecondary }}>Investor Onboarding</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-sm px-4 py-2 rounded-full transition-all"
            style={{ background: colors.chipBg, color: colors.textSecondary }}
          >
            Save & Exit
          </button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="px-6 py-6 border-b" style={{ borderColor: colors.cardBorder }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: currentStep === step.id
                        ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
                        : currentStep > step.id
                          ? colors.success
                          : colors.chipBg,
                      border: currentStep >= step.id ? 'none' : `1px solid ${colors.inputBorder}`
                    }}
                  >
                    <StepIcon icon={step.icon} isActive={currentStep === step.id} isCompleted={currentStep > step.id} colors={colors} />
                  </div>
                  <p
                    className="text-xs font-medium mt-2 hidden md:block"
                    style={{ color: currentStep >= step.id ? colors.textPrimary : colors.textTertiary }}
                  >
                    {step.name}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="w-12 md:w-20 h-0.5 mx-2"
                    style={{ background: currentStep > step.id ? colors.success : colors.progressBg }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </main>

      {/* Footer Navigation */}
      <footer
        className="sticky bottom-0 px-6 py-4"
        style={{
          background: colors.cardBackground,
          borderTop: `1px solid ${colors.cardBorder}`,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2.5 rounded-full font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: colors.chipBg, color: colors.textSecondary }}
          >
            Back
          </button>

          <div className="text-sm" style={{ color: colors.textTertiary }}>
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < 6 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                boxShadow: `0 4px 14px ${colors.glassShadow}`
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full font-semibold text-sm text-white transition-all hover:shadow-lg disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}CC 100%)`,
                boxShadow: `0 4px 14px ${isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`
              }}
            >
              {isSubmitting ? 'Processing...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
