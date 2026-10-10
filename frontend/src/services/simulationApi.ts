import { api } from './api';
import {
  WhatIfRequest,
  WhatIfResponse,
  SimulationStatus
} from '../types';

export const simulationApi = {
  getStatus: () => api.get<SimulationStatus>('/simulation/status'),
  setScenario: (scenario: string) => api.post<{ status: string; active_scenario: any }>('/simulation/set-scenario', { scenario }),
  setInterval: (interval_sec: number) => api.post<{ interval_sec: number }>('/simulation/set-interval', { interval_sec }),
  start: () => api.post<{ status: string; is_running: boolean }>('/simulation/start'),
  stop: () => api.post<{ status: string; is_running: boolean }>('/simulation/stop'),
  runWhatIf: (data: WhatIfRequest) => api.post<WhatIfResponse>('/simulation/whatif', data),
};
