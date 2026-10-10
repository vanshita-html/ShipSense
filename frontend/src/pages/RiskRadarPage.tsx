import React, { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Activity,
  ShieldAlert,
  Flame,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { riskApi } from '../services/riskApi';
import { RiskSummary, CorridorRisk, ModeRisk } from '../types';
import { StatCard } from '../components/common/StatCard';
import { FooterNotice } from '../components/common/FooterNotice';
import { RISK_COLORS } from '../constants/theme';

export const RiskRadarPage: React.FC = () => {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [corridors, setCorridors] = useState<CorridorRisk[]>([]);
  const [modes, setModes] = useState<ModeRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sum, cor, mod] = await Promise.all([
          riskApi.getSummary(),
          riskApi.getByCorridor(),
          riskApi.getByMode(),
        ]);
        setSummary(sum);
        setCorridors(cor);
        setModes(mod);
      } catch (err) {
        console.error('Failed to load risk radar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Format Radar data
  const radarData = corridors.slice(0, 8).map((c) => ({
    corridor: c.corridor.split(' - ')[0],
    Risk: c.avg_risk_probability,
    Weather: c.avg_weather_severity * 10,
    Congestion: c.avg_hub_congestion,
  }));

  return (
    <div className="space-y-6">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Batch Risk Exposure"
          value={`${summary?.batch_exposure_score ?? 0} / 100`}
          subtext="Volume-weighted exposure index"
          icon={Flame}
          highlightVariant="coral"
        />

        <StatCard
          label="Escalation Velocity"
          value={summary?.escalation_score ?? 0}
          subtext="Active critical priority payloads"
          icon={ShieldAlert}
          highlightVariant="amber"
        />

        <StatCard
          label="Average Corridor Risk"
          value={`${summary?.avg_risk_probability ?? 0}%`}
          subtext="Model prediction aggregate"
          icon={TrendingUp}
          highlightVariant="teal"
        />

        <StatCard
          label="Expected Lead Time Variance"
          value={`+${summary?.avg_expected_delay_days ?? 0} Days`}
          subtext="Cumulative regressor delay"
          icon={Clock}
          highlightVariant="emerald"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: Corridor Risk Vectors */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Corridor Multi-Vector Risk Radar
                </h3>
                <p className="text-2xs text-slate-400">Comparing Risk %, Weather Severity, and Hub Congestion</p>
              </div>
              <span className="p-1.5 rounded-lg bg-teal-100 text-teal-600">
                <Activity className="w-4 h-4" />
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#94a3b8" strokeOpacity={0.25} />
                  <PolarAngleAxis dataKey="corridor" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Delay Risk %"
                    dataKey="Risk"
                    stroke={RISK_COLORS.Critical}
                    fill={RISK_COLORS.Critical}
                    fillOpacity={0.4}
                  />
                  <Radar
                    name="Weather Hazard (x10)"
                    dataKey="Weather"
                    stroke="#0284C7"
                    fill="#0284C7"
                    fillOpacity={0.25}
                  />
                  <Radar
                    name="Hub Congestion %"
                    dataKey="Congestion"
                    stroke={RISK_COLORS.High}
                    fill={RISK_COLORS.High}
                    fillOpacity={0.25}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transport Mode Risk Comparison with Dual Y-Axis */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Risk Profile by Transport Mode
                </h3>
                <p className="text-2xs text-slate-400">Risk % (Left Axis) vs Expected Delay in Days (Right Axis)</p>
              </div>
              <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                <Layers className="w-4 h-4" />
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modes} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <XAxis dataKey="transport_mode" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    domain={[0, 5]}
                    unit="d"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ModeRisk;
                        return (
                          <div className="p-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg">
                            <p className="font-bold">{data.transport_mode}</p>
                            <p className="text-teal-300">Avg Risk: {data.avg_risk_probability}%</p>
                            <p className="text-amber-300">Expected Delay: +{data.avg_expected_delay_days} days</p>
                            <p className="text-slate-400 text-2xs">Volume: {data.total_shipments} shipments</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="avg_risk_probability"
                    name="Average Risk %"
                    fill="#0D9488"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avg_expected_delay_days"
                    name="Expected Delay (Days)"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor Heat Breakdown Table */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200  shadow-md">
        <h3 className="text-sm font-extrabold text-slate-900  mb-4">
          Corridor Risk Heat Matrix (All Major Corridors)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80  text-slate-600  font-bold uppercase tracking-wider text-2xs">
              <tr>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">Shipments Monitored</th>
                <th className="py-2.5 px-3">Risk Probability</th>
                <th className="py-2.5 px-3">Weather Index</th>
                <th className="py-2.5 px-3">Hub Congestion</th>
                <th className="py-2.5 px-3">Mean Expected Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 ">
              {corridors.map((c) => (
                <tr key={c.corridor} className="hover:bg-slate-50 ">
                  <td className="py-2.5 px-3 font-bold text-slate-900 ">{c.corridor}</td>
                  <td className="py-2.5 px-3 font-mono">{c.total_shipments}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${c.avg_risk_probability}%`,
                            backgroundColor:
                              c.avg_risk_probability > 70
                                ? RISK_COLORS.Critical
                                : c.avg_risk_probability > 50
                                ? RISK_COLORS.High
                                : c.avg_risk_probability > 30
                                ? RISK_COLORS.Medium
                                : RISK_COLORS.Low,
                          }}
                        />
                      </div>
                      <span className="font-bold">{c.avg_risk_probability}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-medium">{c.avg_weather_severity} / 10</td>
                  <td className="py-2.5 px-3 font-medium">{c.avg_hub_congestion} / 100</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 ">
                    +{c.avg_expected_delay_days} days
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FooterNotice />
    </div>
  );
};
