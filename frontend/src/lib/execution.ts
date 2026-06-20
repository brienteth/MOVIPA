export function getExecutionStatusColor(status: 'idle' | 'pending' | 'executed' | 'failed'): string {
  switch (status) {
    case 'executed':
      return 'text-brick3-green';
    case 'pending':
      return 'text-brick3-cyan';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-brick3-silver/70';
  }
}
