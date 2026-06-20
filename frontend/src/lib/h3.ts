export function h3ExecutionScore(input: {
  latencyMs: number;
  inclusionSpeed: number;
  relayReliability: number;
  builderSuccess: number;
  historicalPnl: number;
}): number {
  const score =
    Math.max(0, 100 - input.latencyMs / 8) * 0.3 +
    input.inclusionSpeed * 0.2 +
    input.relayReliability * 0.2 +
    input.builderSuccess * 0.2 +
    input.historicalPnl * 0.1;

  return Math.max(0, Math.min(100, Number(score.toFixed(2))));
}
