export function riskToLabel(risk: number): 'low' | 'medium' | 'high' {
  if (risk < 0.25) return 'low';
  if (risk < 0.6) return 'medium';
  return 'high';
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}
