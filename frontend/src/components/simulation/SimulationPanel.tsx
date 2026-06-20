import React from 'react';
import Panel from '../ui/Panel';
import RiskMeter from './RiskMeter';
import ProfitForecast from './ProfitForecast';
import LatencyChart from './LatencyChart';

export default function SimulationPanel() {
  return (
    <Panel title="Simulation Stream">
      <div className="space-y-4">
        <ProfitForecast />
        <RiskMeter />
        <LatencyChart />
      </div>
    </Panel>
  );
}
