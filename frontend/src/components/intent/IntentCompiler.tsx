import { compileIntent } from '../../lib/compiler';
import { useExecutionStore } from '../../store/execution.store';
import { useIntentStore } from '../../store/intent.store';

export function runIntentCompiler() {
  const intent = useIntentStore.getState().intent;
  const graph = compileIntent(intent);
  useExecutionStore.getState().setGraph(graph);
  useExecutionStore.getState().setStatus('ready');
  return graph;
}
