export type StreamEventName =
  | 'simulation:update'
  | 'solver:update'
  | 'execution:update'
  | 'risk:update'
  | 'h3:routing';

export type StreamEventPayload = {
  type: StreamEventName;
  data: any;
  timestamp: string;
};

import { API_BASE } from './api';

export function createBrick3Socket(userId: string): WebSocket {
  const wsBase = API_BASE.replace('http://', 'ws://').replace('https://', 'wss://');
  return new WebSocket(`${wsBase}/ws/arbitrage/monitor/${userId}`);
}
