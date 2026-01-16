export const formatCurrency = (value: number) =>
  value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const formatWeight = (value: number) => `${value.toFixed(1)}%`;
