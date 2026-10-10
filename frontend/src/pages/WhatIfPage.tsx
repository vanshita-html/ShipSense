import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CloudRain,
  Anchor,
  ShieldCheck,
  PackageCheck,
  Truck,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { simulationApi } from '../services/simulationApi';
import { WhatIfRequest, WhatIfResponse } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { FooterNotice } from '../components/common/FooterNotice';
import { RISK_COLORS } from '../constants/theme';

export const WhatIfPage: React.FC = () => {
  // Input parameters
  const [origin, setOrigin] = useState('Mumbai');
  const [destination, setDestination] = useState('Bangalore');
  const [corridor, setCorridor] = useState('Mumbai - Bangalore');
  const [transportMode, setTransportMode] = useState('Road');
  const [distanceKm, setDistanceKm] = useState(980);
  const [leadTimeDays, setLeadTimeDays] = useState(4.0);
  const [weatherSeverity, setWeatherSeverity] = useState(7.5);
  const [supplierReliability, setSupplierReliability] = useState(82.0);
  const [hubCongestion, setHubCongestion] = useState(65.0);
  const [inventoryLevel, setInventoryLevel] = useState(6.0);
  const [orderPriority, setOrderPriority] = useState('High');

  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload: WhatIfRequest = {
        origin,
        destination,
        corridor,
        transport_mode: transportMode,
        distance_km: distanceKm,
        lead_time_days: leadTimeDays,
        weather_severity: weatherSeverity,
        supplier_reliability: supplierReliability,
        hub_congestion: hubCongestion,
        inventory_level: inventoryLevel,
        order_priority: orderPriority,
        supplier_id: 'SUP-101',
      };
      const res = await simulationApi.runWhatIf(payload);
      setResult(res);
    } catch (err) {
      console.error('Failed to run What-If simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(runSimulation, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [
    corridor,
    transportMode,
    weatherSeverity,
    supplierReliability,
    hubCongestion,
    inventoryLevel,
    orderPriority,
  ]);

  const getShapChartData = () => {
    if (!result?.shap_drivers) return [];
    return result.shap_drivers.map((d) => ({
      name: d.feature.replace('_', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
      impact: d.impact_magnitude * (d.direction === 'INCREASES_RISK' ? 1 : -1),
      shapValue: d.shap_value,
      direction: d.direction,
      explanation: d.explanation,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Simulation Parameter Controls (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl space-y-5 border border-slate-200  shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100  pb-3">
            <h3 className="text-sm font-extrabold text-slate-900  flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Hypothetical Parameters
            </h3>
            <button
              onClick={() => {
                setWeatherSeverity(2.5);
                setSupplierReliability(90.0);
                setHubCongestion(30.0);
                setInventoryLevel(15.0);
              }}
              className="text-2xs font-bold text-teal-600  hover:underline"
            >
              Reset to Ideal
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Corridor Selector */}
            <div>
              <label className="block font-bold text-slate-700  mb-1">
                Corridor & Route
              </label>
              <select
                value={corridor}
                onChange={(e) => {
                  const val = e.target.value;
                  setCorridor(val);
                  const parts = val.split(' - ');
                  setOrigin(parts[0]);
                  setDestination(parts[1]);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-hidden font-medium"
              >
                <option value="Mumbai - Bangalore">Mumbai - Bangalore (980 km)</option>
                <option value="Delhi NCR - Mumbai">Delhi NCR - Mumbai (1420 km)</option>
                <option value="Bangalore - Chennai">Bangalore - Chennai (350 km)</option>
                <option value="Ahmedabad - Nagpur">Ahmedabad - Nagpur (860 km)</option>
                <option value="Kolkata - Hyderabad">Kolkata - Hyderabad (1480 km)</option>
                <option value="Mundra Port - Delhi NCR">Mundra Port - Delhi NCR (1120 km)</option>
                <option value="JNPT Mumbai - Pune">JNPT Mumbai - Pune (150 km)</option>
              </select>
            </div>

            {/* Transport Mode & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700  mb-1">
                  Transport Mode
                </label>
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-hidden font-medium"
                >
                  <option value="Road">Road Express</option>
                  <option value="Rail">Rail Freight (DFC)</option>
                  <option value="Air">Air Cargo</option>
                  <option value="Sea">Maritime Coastal</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700  mb-1">
                  Priority
                </label>
                <select
                  value={orderPriority}
                  onChange={(e) => setOrderPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-hidden font-medium"
                >
                  <option value="Standard">Standard</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Weather Severity Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-700 ">
                  <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                  Weather Severity Index
                </span>
                <span className="font-mono font-bold text-blue-600 ">
                  {weatherSeverity.toFixed(1)} / 10
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={weatherSeverity}
                onChange={(e) => setWeatherSeverity(parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>Clear Sky (0.5)</span>
                <span>Severe Monsoon (10.0)</span>
              </div>
            </div>

            {/* Hub Congestion Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-700 ">
                  <Anchor className="w-3.5 h-3.5 text-amber-500" />
                  Hub / Port Congestion
                </span>
                <span className="font-mono font-bold text-amber-600 ">
                  {hubCongestion.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="99"
                step="1"
                value={hubCongestion}
                onChange={(e) => setHubCongestion(parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>Fluid (10%)</span>
                <span>Severe Gridlock (99%)</span>
              </div>
            </div>

            {/* Supplier Reliability Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-700 ">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Carrier Historical Reliability
                </span>
                <span className="font-mono font-bold text-emerald-600 ">
                  {supplierReliability.toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                step="1"
                value={supplierReliability}
                onChange={(e) => setSupplierReliability(parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            {/* Inventory Buffer Stock */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-2xs">
                <span className="font-bold flex items-center gap-1.5 text-slate-700 ">
                  <PackageCheck className="w-3.5 h-3.5 text-purple-500" />
                  Downstream Buffer Stock (Days)
                </span>
                <span className="font-mono font-bold text-purple-600 ">
                  {inventoryLevel.toFixed(0)} Days
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                step="1"
                value={inventoryLevel}
                onChange={(e) => setInventoryLevel(parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Right: Live Simulated Output & SHAP (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Output Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-500 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">
                    Simulated Delay Probability
                  </span>
                  {result && <RiskBadge band={result.simulated_risk_band} size="sm" />}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-slate-900 ">
                    {result ? `${result.simulated_risk_probability}%` : '—'}
                  </span>
                  {result?.delta_risk_pct !== undefined && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        result.delta_risk_pct > 0
                          ? 'bg-rose-100 text-rose-700  '
                          : 'bg-emerald-100 text-emerald-700  '
                      }`}
                    >
                      {result.delta_risk_pct > 0 ? `+${result.delta_risk_pct}% vs Normal` : `${result.delta_risk_pct}% vs Normal`}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-2xs text-slate-400 mt-2">
                Prediction Confidence: {result?.confidence_score ?? 85}%
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-500">
                  Expected Delay Duration
                </span>
                <p className="text-4xl font-black text-amber-600  mt-1">
                  {result ? `+${result.simulated_expected_delay_days}d` : '—'}
                </p>
              </div>
              <p className="text-2xs text-slate-400 mt-2">
                XGBoost Regressor Expected Lead Time Delta
              </p>
            </div>
          </div>

          {/* Recalculated SHAP Bar Chart */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200  shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900  flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Live Recalculated SHAP Feature Drivers
                </h3>
                <p className="text-2xs text-slate-400">Instant feature attribution dynamically generated for your sandbox parameters</p>
              </div>
              {loading && <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />}
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={getShapChartData()}
                  margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg max-w-xs">
                            <p className="font-bold">{data.name}</p>
                            <p className="text-2xs text-slate-300 mt-1">{data.explanation}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {getShapChartData().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.direction === 'INCREASES_RISK' ? RISK_COLORS.Critical : RISK_COLORS.Low}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Drivers List */}
            <div className="space-y-2 mt-4">
              {result?.shap_drivers.slice(0, 3).map((driver, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                    driver.direction === 'INCREASES_RISK'
                      ? 'bg-rose-50/50  border-rose-200  text-rose-900 '
                      : 'bg-emerald-50/50  border-emerald-200  text-emerald-900 '
                  }`}
                >
                  {driver.direction === 'INCREASES_RISK' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-medium text-2xs">{driver.explanation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FooterNotice />
    </div>
  );
};
