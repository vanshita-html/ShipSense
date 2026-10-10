import { api } from './api';
import { RiskSummary, CorridorRisk, ModeRisk } from '../types';

export const riskApi = {
  getSummary: () => api.get<RiskSummary>('/risk/summary'),
  getByCorridor: () => api.get<CorridorRisk[]>('/risk/by-corridor'),
  getByMode: () => api.get<ModeRisk[]>('/risk/by-mode'),
};
