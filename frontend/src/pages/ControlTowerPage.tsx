import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Package,
  AlertTriangle,
  Clock,
  TrendingUp,
  X,
  Truck,
  CloudRain,
  Anchor,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { riskApi } from '../services/riskApi';
import { RiskSummary, CorridorRisk } from '../types';
import { IndiaCorridorMap } from '../components/map/IndiaCorridorMap';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { FooterNotice } from '../components/common/FooterNotice';

export const ControlTowerPage: React.FC = () => {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [corridors, setCorridors] = useState<CorridorRisk[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorRisk | null>(null);
  const [, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchControlTowerData = async () => {
    try {
      const [sumRes, corRes] = await Promise.all([
        riskApi.getSummary(),
        riskApi.getByCorridor(),
      ]);
      setSummary(sumRes);
      setCorridors(corRes);
    } catch (err) {
      console.error('Failed to fetch Control Tower data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControlTowerData();
    const interval = setInterval(fetchControlTowerData, 5000); // 5s telemetry sync
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* AI Daily Briefing Banner Card */}
      <div className="glass-card p-5 rounded-2xl border-l-4 border-l-teal-500 flex items-start gap-4 shadow-xs bg-linear-to-r from-white to-teal-50/40">
        <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-800">
              Today's Operational AI Briefing
            </h3>
            <span className="text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-800">
              Live Telemetry Sync
            </span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {summary?.ai_daily_briefing || 'Aggregating national corridor telemetry...'}
          </p>
        </div>
      </div>

      {/* Main Map View */}
      <div className="relative">
        <IndiaCorridorMap
          corridors={corridors}
          onSelectCorridor={(c) => setSelectedCorridor(c)}
        />

        {/* Slide-Over Corridor Detail Drawer */}
        <AnimatePresence>
          {selectedCorridor && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute top-4 right-4 bottom-4 w-full max-w-sm glass-card bg-white/95 border border-slate-200 shadow-2xl rounded-2xl p-5 z-30 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-teal-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      {selectedCorridor.corridor}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedCorridor(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Risk Assessment:</span>
                    <RiskBadge band={selectedCorridor.risk_band} size="md" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-slate-400 text-2xs font-semibold">Risk Probability</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedCorridor.avg_risk_probability}%
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-slate-400 text-2xs font-semibold">Expected Delay</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        {selectedCorridor.avg_expected_delay_days} days
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100/60">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                        Weather Hazard:
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedCorridor.avg_weather_severity} / 10
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100/60">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Anchor className="w-3.5 h-3.5 text-amber-500" />
                        Hub Congestion:
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedCorridor.avg_hub_congestion} / 100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/shipments?corridor=${encodeURIComponent(selectedCorridor.corridor)}`)}
                  className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <span>Inspect Consignments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Compact Stats Strip (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Active Consignments"
          value={summary?.total_shipments ?? '—'}
          subtext="Telemetry across 12 corridors"
          icon={Package}
          highlightVariant="teal"
        />

        <StatCard
          label="High / Critical Risk %"
          value={`${summary?.high_or_critical_pct ?? 0}%`}
          subtext={`${summary?.critical_risk_count ?? 0} critical priority shipments`}
          icon={AlertTriangle}
          highlightVariant="coral"
          trend={{
            value: summary?.high_or_critical_pct && summary.high_or_critical_pct > 25 ? 'High Hazard' : 'Stable Flow',
            isPositive: summary?.high_or_critical_pct ? summary.high_or_critical_pct < 25 : true,
          }}
        />

        <StatCard
          label="Mean Expected Delay"
          value={`${summary?.avg_expected_delay_days ?? 0} Days`}
          subtext="Weighted regressor estimate"
          icon={Clock}
          highlightVariant="amber"
        />

        <StatCard
          label="Corridor Escalation Index"
          value={summary?.escalation_score ?? 0}
          subtext="Urgent intervention rating (0-100)"
          icon={TrendingUp}
          highlightVariant="emerald"
        />
      </div>

      {/* Footer Notice */}
      <FooterNotice />
    </div>
  );
};
