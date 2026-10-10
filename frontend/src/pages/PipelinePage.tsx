import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  History,
  Activity,
} from 'lucide-react';
import { monitoringApi } from '../services/monitoringApi';
import { PipelineStatus } from '../types';
import { FooterNotice } from '../components/common/FooterNotice';

export const PipelinePage: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageIdx, setSelectedStageIdx] = useState(0);

  const fetchPipeline = async () => {
    try {
      const res = await monitoringApi.getPipelineStatus();
      setPipeline(res);
    } catch (err) {
      console.error('Failed to load pipeline status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
    const interval = setInterval(fetchPipeline, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStageIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Database className="w-4 h-4" />;
      case 1:
        return <CheckCircle2 className="w-4 h-4" />;
      case 2:
        return <Layers className="w-4 h-4" />;
      case 3:
        return <Cpu className="w-4 h-4" />;
      case 4:
        return <Sparkles className="w-4 h-4" />;
      case 5:
        return <Zap className="w-4 h-4" />;
      case 6:
        return <History className="w-4 h-4" />;
      case 7:
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const selectedStage = pipeline?.stages[selectedStageIdx];

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="flex items-center justify-end">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Overall Status: {pipeline?.overall_health || 'OPERATIONAL'}
        </span>
      </div>

      {/* Horizontal Interactive Stepper */}
      <div className="glass-card p-6 rounded-2xl border border-slate-200 shadow-md overflow-x-auto">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-6">
          Lifecycle Progression Stepper
        </h3>

        <div className="flex items-center min-w-[760px] justify-between relative">
          {/* Connecting Track */}
          <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-200  -z-0" />

          {pipeline?.stages?.map((stage, idx) => {
            const isSelected = selectedStageIdx === idx;
            return (
              <div
                key={stage.stage}
                onClick={() => setSelectedStageIdx(idx)}
                className="relative z-10 flex flex-col items-center cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                    isSelected
                      ? 'bg-teal-600 text-white ring-4 ring-teal-500/20 scale-110'
                      : 'bg-white  border border-slate-200  text-slate-600  group-hover:border-teal-500'
                  }`}
                >
                  {getStageIcon(idx)}
                </div>
                <span className="text-2xs font-bold text-slate-700  mt-2 text-center max-w-[90px] truncate">
                  {stage.stage.split('.')[1] || stage.stage}
                </span>
                <span className="text-3xs text-emerald-600  font-semibold mt-0.5">
                  {stage.duration_ms}ms
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Detail Card */}
      {selectedStage && (
        <motion.div
          key={selectedStage.stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border border-slate-200  shadow-md space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100  pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
                {getStageIcon(selectedStageIdx)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 ">
                  Stage {selectedStage.stage}
                </h3>
                <p className="text-xs text-slate-500">{selectedStage.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700   text-xs font-bold">
                {selectedStage.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 ">
              <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold block">Execution Latency</span>
              <span className="text-xl font-bold text-slate-900  mt-1 block">
                {selectedStage.duration_ms} ms
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 ">
              <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold block">Records Processed</span>
              <span className="text-xl font-bold text-teal-600  mt-1 block">
                {selectedStage.records_processed} items
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 ">
              <span className="text-2xs uppercase tracking-wider text-slate-400 font-bold block">Last Heartbeat</span>
              <span className="text-sm font-semibold text-slate-700  mt-1 block">
                {new Date(selectedStage.last_run_time).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      <FooterNotice />
    </div>
  );
};
