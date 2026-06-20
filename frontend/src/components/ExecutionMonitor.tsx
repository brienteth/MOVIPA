import React, { useState, useEffect } from 'react';

interface ExecutionMonitorProps {
  workflow: any;
}

const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({ workflow }) => {
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (workflow && workflow.workflow_id) {
      setExecutionStatus('running');
      setCurrentStep(0);
      setLogs(['Initializing execution...', 'Connecting to Citadel Registry...']);

      // Simulate execution progress
      const steps = workflow.steps || [];
      let stepIndex = 0;

      const interval = setInterval(() => {
        if (stepIndex < steps.length) {
          setCurrentStep(stepIndex + 1);
          setLogs(prev => [...prev, `Executing step ${stepIndex + 1}: ${steps[stepIndex].action || steps[stepIndex].label}`]);
          stepIndex++;
        } else {
          setExecutionStatus('completed');
          setLogs(prev => [...prev, 'Execution completed successfully!', 'Citadel verification: PASSED']);
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [workflow]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-gray-400';
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return '⏸️';
      case 'running': return '⚙️';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  return (
    <div className="flex-1 p-6 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Execution Monitor</h2>

        {/* Status Overview */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Workflow Execution</h3>
            <div className={`flex items-center space-x-2 ${getStatusColor(executionStatus)}`}>
              <span>{getStatusIcon(executionStatus)}</span>
              <span className="capitalize">{executionStatus}</span>
            </div>
          </div>

          {workflow && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{currentStep}</div>
                <div className="text-sm text-gray-400">Current Step</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{workflow.steps?.length || 0}</div>
                <div className="text-sm text-gray-400">Total Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{workflow.estimated_gas || 0}</div>
                <div className="text-sm text-gray-400">Est. Gas</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {workflow && executionStatus !== 'idle' && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round((currentStep / (workflow.steps?.length || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / (workflow.steps?.length || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Step Details */}
            <div className="space-y-2">
              {workflow.steps?.map((step: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-md ${
                    index < currentStep ? 'bg-green-900/20 border border-green-500/30' :
                    index === currentStep && executionStatus === 'running' ? 'bg-blue-900/20 border border-blue-500/30' :
                    'bg-gray-700/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    index < currentStep ? 'bg-green-600' :
                    index === currentStep && executionStatus === 'running' ? 'bg-blue-600' :
                    'bg-gray-600'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{step.action || step.label}</div>
                    <div className="text-sm text-gray-400">{step.protocol}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {index < currentStep ? 'Completed' :
                     index === currentStep && executionStatus === 'running' ? 'Running...' :
                     'Pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Execution Logs</h3>
          <div className="bg-black rounded-md p-4 font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-green-400 mb-1">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No execution logs yet. Generate a workflow to see execution progress.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionMonitor;