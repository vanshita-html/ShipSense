export interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  company_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface SHAPDriver {
  feature: string;
  direction: 'INCREASES_RISK' | 'REDUCES_RISK';
  impact_magnitude: number;
  shap_value: number;
  explanation: string;
}

export interface SimilarShipment {
  shipment_id: string;
  origin: string;
  destination: string;
  corridor: string;
  transport_mode: string;
  supplier_name?: string;
  weather_severity: number;
  similarity_score: number;
  actual_delay_days: number;
  delayed: boolean;
  outcome_description: string;
}

export interface Shipment {
  id: number;
  shipment_id: string;
  supplier_id: string;
  supplier_name?: string;
  origin: string;
  destination: string;
  corridor: string;
  transport_mode: 'Road' | 'Rail' | 'Air' | 'Sea';
  distance_km: number;
  lead_time_days: number;
  weather_severity: number;
  supplier_reliability: number;
  hub_congestion: number;
  inventory_level: number;
  order_priority: 'Standard' | 'High' | 'Critical';
  status: string;
  risk_probability: number;
  expected_delay_days: number;
  risk_band: 'Low' | 'Medium' | 'High' | 'Critical';
  shap_drivers: SHAPDriver[];
  actual_delay_days?: number;
  delayed?: boolean;
  outcome_status?: string;
  created_at: string;
  updated_at?: string;
  delivered_at?: string;
}

export interface ShipmentListResponse {
  items: Shipment[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RiskSummary {
  total_shipments: number;
  high_risk_count: number;
  critical_risk_count: number;
  high_or_critical_pct: number;
  avg_risk_probability: number;
  avg_expected_delay_days: number;
  batch_exposure_score: number;
  escalation_score: number;
  risk_bands: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  ai_daily_briefing: string;
  data_notice: string;
}

export interface CorridorRisk {
  corridor: string;
  total_shipments: number;
  avg_risk_probability: number;
  avg_expected_delay_days: number;
  avg_weather_severity: number;
  avg_hub_congestion: number;
  risk_band: string;
}

export interface ModeRisk {
  transport_mode: string;
  total_shipments: number;
  avg_risk_probability: number;
  avg_expected_delay_days: number;
  risk_band: string;
}

export interface TradeOffs {
  cost_impact: string;
  time_gain: string;
  feasibility: string;
}

export interface Recommendation {
  action_id: string;
  action_code: string;
  title: string;
  urgency: string;
  rationale: string;
  expected_effect: string;
  trade_offs: TradeOffs;
  relevance_score: number;
  status: string;
  guardrail_notice: string;
}

export interface ShipmentRecommendationsResponse {
  shipment_id: string;
  risk_probability: number;
  risk_band: string;
  recommendations: Recommendation[];
}

export interface KanbanCard {
  id: string;
  shipment_id: string;
  corridor: string;
  transport_mode: string;
  risk_probability: number;
  risk_band: string;
  order_priority: string;
  action: Recommendation;
  board_column: 'RECOMMENDED' | 'UNDER_REVIEW' | 'COMMITTED' | 'DONE';
}

export interface Decision {
  id: number;
  decision_id: string;
  user_id?: number;
  user_name: string;
  user_email: string;
  scope: string;
  shipment_id?: string;
  target_entities?: string;
  action_code: string;
  action_title: string;
  rationale: string;
  ai_recommendation_rank?: number;
  expected_effect?: string;
  trade_offs?: string;
  status: string;
  created_at: string;
}

export interface FeatureDriftItem {
  feature: string;
  psi_score: number;
  ks_statistic?: number;
  ks_p_value?: number;
  status: 'STABLE' | 'MODERATE_DRIFT' | 'CRITICAL_DRIFT';
  baseline_mean: number;
  current_mean: number;
  baseline_std: number;
  current_std: number;
}

export interface DriftMonitoringResponse {
  overall_status: string;
  drift_alert_count: number;
  features_monitored: number;
  sample_size_current: number;
  sample_size_baseline: number;
  feature_metrics: FeatureDriftItem[];
  notice: string;
}

export interface ModelHealth {
  status: string;
  model_version: string;
  classifier_roc_auc: number;
  classifier_accuracy: number;
  classifier_precision: number;
  classifier_recall: number;
  classifier_f1: number;
  regressor_mae_days: number;
  regressor_rmse_days: number;
  last_trained: string;
  sample_size_test: number;
  data_source_notice: string;
}

export interface PipelineStageInfo {
  stage: string;
  status: string;
  last_run_time: string;
  duration_ms: number;
  records_processed: number;
  message?: string;
}

export interface PipelineStatus {
  overall_health: string;
  total_stages: number;
  stages: PipelineStageInfo[];
}

export interface WhatIfRequest {
  origin: string;
  destination: string;
  corridor: string;
  transport_mode: string;
  distance_km: number;
  lead_time_days: number;
  weather_severity: number;
  supplier_reliability: number;
  hub_congestion: number;
  inventory_level: number;
  order_priority: string;
  supplier_id: string;
}

export interface WhatIfResponse {
  original_risk_probability?: number;
  simulated_risk_probability: number;
  simulated_expected_delay_days: number;
  simulated_risk_band: string;
  confidence_score: number;
  shap_drivers: SHAPDriver[];
  delta_risk_pct?: number;
}

export interface SimulationStatus {
  is_running: boolean;
  current_scenario: string;
  interval_sec: number;
  available_scenarios: Array<{
    key: string;
    name: string;
    description: string;
  }>;
}
