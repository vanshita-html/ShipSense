import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  SlidersHorizontal,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Clock,
  Truck,
  Plane,
  Ship,
  Train,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  History,
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
import { shipmentApi, ShipmentFilterParams } from '../services/shipmentApi';
import { Shipment, SimilarShipment, SHAPDriver } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { FooterNotice } from '../components/common/FooterNotice';
import { RISK_COLORS } from '../constants/theme';

export const ShipmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [similarShipments, setSimilarShipments] = useState<SimilarShipment[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [riskFilter, setRiskFilter] = useState(searchParams.get('risk_band') || '');
  const [modeFilter, setModeFilter] = useState(searchParams.get('transport_mode') || '');
  const [corridorFilter, setCorridorFilter] = useState(searchParams.get('corridor') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params: ShipmentFilterParams = {
        page,
        page_size: 15,
        search: searchTerm || undefined,
        risk_band: riskFilter || undefined,
        transport_mode: modeFilter || undefined,
        corridor: corridorFilter || undefined,
        status: statusFilter || undefined,
      };
      const res = await shipmentApi.getShipments(params);
      setShipments(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, riskFilter, modeFilter, corridorFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const openShipmentDrawer = async (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setLoadingSimilar(true);
    try {
      const similar = await shipmentApi.getSimilarShipments(shipment.shipment_id);
      setSimilarShipments(similar);
    } catch (err) {
      console.error('Failed to fetch similar shipments:', err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'Air':
        return <Plane className="w-3.5 h-3.5 text-sky-500" />;
      case 'Sea':
        return <Ship className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Rail':
        return <Train className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Truck className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  // SHAP chart data formatting
  const getShapChartData = (drivers: SHAPDriver[]) => {
    return (drivers || []).map((d) => ({
      name: d.feature.replace('_', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()),
      impact: d.impact_magnitude * (d.direction === 'INCREASES_RISK' ? 1 : -1),
      shapValue: d.shap_value,
      direction: d.direction,
      explanation: d.explanation,
    }));
  };

  return (
    <div className="space-y-5 min-w-0">
      {/* Top Action Bar: Count & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Consignments Monitored:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-2xs font-extrabold">
            {totalCount} Total
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 w-fit">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-teal-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'card'
                ? 'bg-white text-teal-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cards View
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search shipment ID, supplier, corridor..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50  border border-slate-200  text-xs text-slate-900  placeholder-slate-400 focus:ring-2 focus:ring-teal-500 outline-hidden"
            />
          </form>

          {/* Risk Band Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  text-xs text-slate-900  outline-hidden font-medium"
            >
              <option value="">All Risk Bands</option>
              <option value="Critical">Critical Risk (&gt;70%)</option>
              <option value="High">High Risk (51-70%)</option>
              <option value="Medium">Medium Risk (31-50%)</option>
              <option value="Low">Low Risk (0-30%)</option>
            </select>
          </div>

          {/* Transport Mode Filter */}
          <div>
            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  text-xs text-slate-900  outline-hidden font-medium"
            >
              <option value="">All Transport Modes</option>
              <option value="Road">Road Express</option>
              <option value="Rail">Rail Freight (DFC)</option>
              <option value="Air">Air Cargo</option>
              <option value="Sea">Maritime Coastal</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  text-xs text-slate-900  outline-hidden font-medium"
            >
              <option value="">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="At Hub">At Hub</option>
              <option value="Delivered">Delivered (Outcome Tracked)</option>
            </select>
          </div>
        </div>

        {/* Filter Chips / Active indicators */}
        {(riskFilter || modeFilter || statusFilter || searchTerm) && (
          <div className="flex items-center gap-2 pt-2 text-2xs text-slate-500">
            <span>Active filters:</span>
            {riskFilter && (
              <span className="px-2 py-0.5 rounded-md bg-teal-100  text-teal-700  font-semibold flex items-center gap-1">
                Risk: {riskFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setRiskFilter('')} />
              </span>
            )}
            {modeFilter && (
              <span className="px-2 py-0.5 rounded-md bg-teal-100  text-teal-700  font-semibold flex items-center gap-1">
                Mode: {modeFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setModeFilter('')} />
              </span>
            )}
            {statusFilter && (
              <span className="px-2 py-0.5 rounded-md bg-teal-100  text-teal-700  font-semibold flex items-center gap-1">
                Status: {statusFilter}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setStatusFilter('')} />
              </span>
            )}
            <button
              onClick={() => {
                setRiskFilter('');
                setModeFilter('');
                setStatusFilter('');
                setSearchTerm('');
              }}
              className="text-teal-600  font-bold hover:underline ml-2"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Main Content (Table or Cards) */}
      {loading ? (
        <div className="p-16 text-center glass-card rounded-2xl">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Fetching corridor telemetry stream...</p>
        </div>
      ) : shipments.length === 0 ? (
        <div className="p-16 text-center glass-card rounded-2xl">
          <Package className="w-12 h-12 text-slate-300  mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 ">No shipments found</h3>
          <p className="text-xs text-slate-400 mt-1">Try broadening your search query or reset filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="glass-card rounded-2xl overflow-hidden shadow-md border border-slate-200 w-full min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-2xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Shipment ID</th>
                  <th className="py-3 px-4">Corridor & Route</th>
                  <th className="py-3 px-4">Carrier / Supplier</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Delay Risk</th>
                  <th className="py-3 px-4">Expected Delay</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  font-medium text-slate-700 ">
                {shipments.map((s) => (
                  <tr
                    key={s.shipment_id}
                    onClick={() => openShipmentDrawer(s)}
                    className="hover:bg-teal-50/50  cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-teal-600 ">
                      {s.shipment_id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 ">{s.corridor}</p>
                      <p className="text-2xs text-slate-400">{s.distance_km} km • Priority: {s.order_priority}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 ">{s.supplier_name || s.supplier_id}</p>
                      <p className="text-2xs text-slate-400">Reliability: {s.supplier_reliability}%</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-semibold">
                        {getModeIcon(s.transport_mode)}
                        <span>{s.transport_mode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <RiskBadge band={s.risk_band} size="sm" />
                        <span className="font-mono font-bold text-xs">{s.risk_probability}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 ">
                      {s.expected_delay_days > 0 ? (
                        <span className="text-amber-600 ">+{s.expected_delay_days} days</span>
                      ) : (
                        <span className="text-emerald-600 ">On Time</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-2xs font-semibold ${
                        s.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-700  '
                          : 'bg-slate-100 text-slate-700  '
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openShipmentDrawer(s);
                        }}
                        className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-100 "
                        title="Explain with SHAP"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shipments.map((s) => (
            <motion.div
              key={s.shipment_id}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              onClick={() => openShipmentDrawer(s)}
              className="glass-card p-5 rounded-2xl cursor-pointer hover:border-teal-500/50 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-teal-600 ">
                    {s.shipment_id}
                  </span>
                  <RiskBadge band={s.risk_band} size="sm" />
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 ">
                  {s.corridor}
                </h4>
                <p className="text-2xs text-slate-400 mt-0.5">
                  Carrier: {s.supplier_name} • {s.distance_km} km
                </p>

                <div className="grid grid-cols-2 gap-2 my-4 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 ">
                    <p className="text-2xs text-slate-400">Risk Probability</p>
                    <p className="text-sm font-extrabold text-slate-900  mt-0.5">
                      {s.risk_probability}%
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 ">
                    <p className="text-2xs text-slate-400">Expected Delay</p>
                    <p className="text-sm font-extrabold text-slate-900  mt-0.5">
                      {s.expected_delay_days > 0 ? `+${s.expected_delay_days}d` : '0d'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100  text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 ">
                  {getModeIcon(s.transport_mode)}
                  {s.transport_mode}
                </span>
                <span className="text-teal-600  font-bold flex items-center gap-1 text-2xs">
                  SHAP Explain <Sparkles className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
        <span>Showing {shipments.length} of {totalCount} shipments</span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200  disabled:opacity-40 font-semibold"
          >
            Previous
          </button>
          <span className="font-bold text-slate-900 ">Page {page}</span>
          <button
            disabled={shipments.length < 15}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl border border-slate-200  disabled:opacity-40 font-semibold"
          >
            Next
          </button>
        </div>
      </div>

      {/* Slide-Over SHAP Deep Explain & Similarity Drawer */}
      <AnimatePresence>
        {selectedShipment && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-white  h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between border-l border-slate-200 "
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100  pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-teal-600 ">
                        {selectedShipment.shipment_id}
                      </span>
                      <RiskBadge band={selectedShipment.risk_band} size="sm" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 ">
                      {selectedShipment.corridor}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Carrier: {selectedShipment.supplier_name} • Priority: {selectedShipment.order_priority}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedShipment(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600  hover:bg-slate-100 "
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Delay Probability & Regressor Gauge Box */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl glass-card bg-teal-50/40  border border-teal-200 ">
                    <p className="text-2xs font-bold uppercase tracking-wider text-teal-700 ">
                      Delay Risk Probability
                    </p>
                    <p className="text-3xl font-black text-teal-900  mt-1">
                      {selectedShipment.risk_probability}%
                    </p>
                    <p className="text-2xs text-teal-600  mt-1">
                      XGBoost Classification Output
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl glass-card bg-amber-50/40  border border-amber-200 ">
                    <p className="text-2xs font-bold uppercase tracking-wider text-amber-700 ">
                      Expected Delay Days
                    </p>
                    <p className="text-3xl font-black text-amber-900  mt-1">
                      {selectedShipment.expected_delay_days > 0
                        ? `+${selectedShipment.expected_delay_days}d`
                        : '0.0d'}
                    </p>
                    <p className="text-2xs text-amber-600  mt-1">
                      XGBoost Regressor Output
                    </p>
                  </div>
                </div>

                {/* SHAP Feature Drivers Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <h4 className="text-sm font-extrabold text-slate-900 ">
                        SHAP Explainability Drivers
                      </h4>
                    </div>
                    <span className="text-2xs font-medium text-slate-400">TreeExplainer Model</span>
                  </div>

                  {/* SHAP Horizontal Chart */}
                  <div className="h-44 w-full p-2 glass-card rounded-xl mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={getShapChartData(selectedShipment.shap_drivers)}
                        margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                      >
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
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
                          {getShapChartData(selectedShipment.shap_drivers).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.direction === 'INCREASES_RISK' ? RISK_COLORS.Critical : RISK_COLORS.Low}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Natural Language Plain English Explanations */}
                  <div className="space-y-2">
                    {selectedShipment.shap_drivers?.map((driver, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                          driver.direction === 'INCREASES_RISK'
                            ? 'bg-rose-50/50  border-rose-200  text-rose-900 '
                            : 'bg-emerald-50/50  border-emerald-200  text-emerald-900 '
                        }`}
                      >
                        <div className="p-1 rounded-lg bg-white/80  shadow-2xs shrink-0">
                          {driver.direction === 'INCREASES_RISK' ? (
                            <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <p className="leading-relaxed font-medium">{driver.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5 Most Similar Past Shipments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-teal-600" />
                      <h4 className="text-sm font-extrabold text-slate-900 ">
                        Historical Twin Consignments (Top 5 Similar)
                      </h4>
                    </div>
                    <span className="text-2xs text-slate-400">Euclidean Distance KNN</span>
                  </div>

                  {loadingSimilar ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Searching historical database for feature matches...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {similarShipments.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl glass-card border border-slate-200  text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 ">
                                {item.shipment_id}
                              </span>
                              <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-teal-100  text-teal-700 ">
                                {item.similarity_score}% match
                              </span>
                            </div>
                            <p className="text-2xs text-slate-400 mt-0.5">
                              {item.corridor} • Mode: {item.transport_mode} • Carrier: {item.supplier_name}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-2xs font-bold px-2 py-0.5 rounded-md ${
                                item.delayed
                                  ? 'bg-rose-100 text-rose-700  '
                                  : 'bg-emerald-100 text-emerald-700  '
                              }`}
                            >
                              {item.outcome_description}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Trigger Button */}
              <div className="pt-6 border-t border-slate-100 ">
                <a
                  href={`/actions?shipment_id=${selectedShipment.shipment_id}`}
                  className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <span>Open Prescriptive Mitigation Options</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FooterNotice />
    </div>
  );
};
