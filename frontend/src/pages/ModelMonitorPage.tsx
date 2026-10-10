import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  BarChart2,
  Info,
} from 'lucide-react';
import { monitoringApi } from '../services/monitoringApi';
import { DriftMonitoringResponse, ModelHealth } from '../types';
import { StatCard } from '../components/common/StatCard';
import { FooterNotice } from '../components/common/FooterNotice';

export const ModelMonitorPage: React.FC = () => {
  const [health, setHealth] = useState<ModelHealth | null>(null);
  const [drift, setDrift] = useState<DriftMonitoringResponse | null>(null);
  const [outcomes, setOutcomes] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      const [h, d, o] = await Promise.all([
        monitoringApi.getHealth(),
        monitoringApi.getDrift(),
        monitoringApi.getOutcomes(),
      ]);
      setHealth(h);
      setDrift(d);
      setOutcomes(o);
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  const getDriftBadge = (status: string) => {
    switch (status) {
      case 'CRITICAL_DRIFT':
        return 'bg-rose-100 text-rose-700   border-rose-300';
      case 'MODERATE_DRIFT':
        return 'bg-amber-100 text-amber-700   border-amber-300';
      case 'STABLE':
      default:
        return 'bg-emerald-100 text-emerald-700   border-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setLoading(true);
            fetchMonitoringData();
          }}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold flex items-center gap-2 hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Re-evaluate Drift</span>
        </button>
      </div>

      {/* Model Health Status Banner */}
      <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-linear-to-r from-emerald-50/20 to-transparent">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                ML Subsystem Health: {health?.status || 'HEALTHY'}
              </h3>
              <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {health?.model_version}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {health?.data_source_notice || 'Evaluated strictly on held-out test set.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <div className="text-right">
            <span className="text-2xs text-slate-400 block">Test Sample Size</span>
            <span className="font-bold text-slate-900">N = {health?.sample_size_test ?? 750}</span>
          </div>
        </div>
      </div>

      {/* Test Set Accuracy & Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-card p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold">Accuracy</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {health ? `${(health.classifier_accuracy * 100).toFixed(1)}%` : '—'}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold">ROC-AUC</span>
          <p className="text-xl font-black text-teal-600 mt-1">
            {health ? health.classifier_roc_auc.toFixed(4) : '—'}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold">Precision</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {health ? `${(health.classifier_precision * 100).toFixed(1)}%` : '—'}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold">Recall</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {health ? `${(health.classifier_recall * 100).toFixed(1)}%` : '—'}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold">F1-Score</span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {health ? `${(health.classifier_f1 * 100).toFixed(1)}%` : '—'}
          </p>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-slate-200 text-center">
          <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold">MAE (Days)</span>
          <p className="text-xl font-black text-amber-600 mt-1">
            {health ? `${health.regressor_mae_days.toFixed(2)}d` : '—'}
          </p>
        </div>
      </div>

      {/* Feature PSI Small Multiples Grid */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-600" />
              Feature Drift Small Multiples (Population Stability Index)
            </h3>
            <p className="text-2xs text-slate-400">
              PSI &lt; 0.10: Stable | 0.10 - 0.25: Moderate Shift | &gt; 0.25: Critical Drift Alert
            </p>
          </div>

          <span className="text-2xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            Monitored Features: {drift?.features_monitored ?? 6}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drift?.feature_metrics?.map((feat) => (
            <div
              key={feat.feature}
              className="p-4 rounded-xl border border-slate-200 bg-white/60 shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 capitalize">
                  {feat.feature.replace('_', ' ')}
                </span>
                <span
                  className={`text-2xs font-bold px-2 py-0.5 rounded-md border ${getDriftBadge(
                    feat.status
                  )}`}
                >
                  {feat.status.replace('_', ' ')}
                </span>
              </div>

              {/* PSI Meter */}
              <div>
                <div className="flex items-center justify-between text-2xs mb-1">
                  <span className="text-slate-400">PSI Score:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {feat.psi_score.toFixed(4)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full ${
                      feat.psi_score >= 0.25
                        ? 'bg-rose-500'
                        : feat.psi_score >= 0.10
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, feat.psi_score * 300)}%` }}
                  />
                </div>
              </div>

              {/* Statistical Distribution Shift: cleanly formatted key-value pairs */}
              <div className="space-y-1 text-2xs pt-2 border-t border-slate-100 text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Baseline Mean:</span>
                  <span className="font-bold text-slate-800 font-mono">{feat.baseline_mean}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Current Mean:</span>
                  <span className="font-bold text-slate-800 font-mono">{feat.current_mean}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-slate-50  text-2xs text-slate-500 flex items-center gap-2">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{drift?.notice || 'Sample distribution compared continuously against baseline training dataset.'}</span>
        </div>
      </div>

      {/* Closed Loop Outcome Calibration */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200  shadow-md">
        <h3 className="text-sm font-extrabold text-slate-900  mb-3">
          Closed-Loop Outcome Calibration (Predicted vs Verified Deliveries)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 ">
            <span className="text-2xs uppercase text-slate-400 font-bold">Total Verified Deliveries</span>
            <p className="text-2xl font-black text-slate-900  mt-1">
              {outcomes?.total_delivered ?? 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 ">
            <span className="text-2xs uppercase text-slate-400 font-bold">Prediction Accuracy</span>
            <p className="text-2xl font-black text-emerald-600  mt-1">
              {outcomes?.accuracy_pct ?? 100}%
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 ">
            <span className="text-2xs uppercase text-slate-400 font-bold">Mean Error (MAE)</span>
            <p className="text-2xl font-black text-slate-900  mt-1">
              {outcomes?.mean_absolute_error_days ?? 0.0} Days
            </p>
          </div>
        </div>
      </div>

      <FooterNotice />
    </div>
  );
};
