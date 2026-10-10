import { api } from './api';
import { Decision } from '../types';

export interface CreateDecisionPayload {
  scope: string;
  shipment_id?: string;
  target_entities?: string;
  action_code: string;
  action_title: string;
  rationale: string;
  ai_recommendation_rank?: number;
  expected_effect?: string;
  trade_offs?: string;
}

export const decisionApi = {
  createDecision: (payload: CreateDecisionPayload) =>
    api.post<Decision>('/decisions', payload),

  getDecisions: (shipmentId?: string) => {
    const qs = shipmentId ? `?shipment_id=${encodeURIComponent(shipmentId)}` : '';
    return api.get<Decision[]>(`/decisions${qs}`);
  },

  verifyOutcome: (decisionId: string, actualDelayDays: number, status = 'Delivered') =>
    api.post<{ message: string; status: string }>(`/decisions/${decisionId}/outcome`, {
      actual_delay_days: actualDelayDays,
      delivered_status: status,
    }),
};
