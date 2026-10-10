import { api } from './api';
import { Shipment, ShipmentListResponse, SimilarShipment, ShipmentRecommendationsResponse } from '../types';

export interface ShipmentFilterParams {
  page?: number;
  page_size?: number;
  risk_band?: string;
  transport_mode?: string;
  corridor?: string;
  supplier_id?: string;
  status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

export const shipmentApi = {
  getShipments: (params: ShipmentFilterParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const qs = query.toString();
    return api.get<ShipmentListResponse>(`/shipments${qs ? `?${qs}` : ''}`);
  },

  getShipmentDetail: (id: string) => api.get<Shipment>(`/shipments/${id}`),

  getSimilarShipments: (id: string) => api.get<SimilarShipment[]>(`/shipments/${id}/similar`),

  getRecommendations: (id?: string) => {
    const qs = id ? `?shipment_id=${encodeURIComponent(id)}` : '';
    return api.get<ShipmentRecommendationsResponse>(`/recommendations${qs}`);
  },

  getAllActionCards: () => api.get<any[]>('/recommendations/all-active'),
};
