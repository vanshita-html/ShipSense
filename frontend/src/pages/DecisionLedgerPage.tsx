import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  History,
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { decisionApi } from '../services/decisionApi';
import { Decision } from '../types';
import { toast } from '../store/notificationStore';
import { FooterNotice } from '../components/common/FooterNotice';

export const DecisionLedgerPage: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actualDelayInput, setActualDelayInput] = useState<number>(0);

  const fetchDecisions = async () => {
    try {
      const list = await decisionApi.getDecisions();
      setDecisions(list);
    } catch (err) {
      console.error('Failed to load decision ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleVerifyOutcome = async (decisionId: string) => {
    try {
      await decisionApi.verifyOutcome(decisionId, actualDelayInput);
      toast.success(`Outcome verified for ${decisionId}. Feedback loop updated.`);
      setVerifyingId(null);
      fetchDecisions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify outcome.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Strip */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setLoading(true);
            fetchDecisions();
          }}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold flex items-center gap-2 hover:bg-slate-50 shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Vertical Timeline */}
      {loading ? (
        <div className="p-16 text-center glass-card rounded-2xl">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading audit ledger...</p>
        </div>
      ) : decisions.length === 0 ? (
        <div className="p-16 text-center glass-card rounded-2xl space-y-4 max-w-md mx-auto">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-700">No decisions committed yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Go to the Action Board to review AI recommendations and commit manager mitigation actions.
            </p>
          </div>
          <Link
            to="/actions"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <span>Go to Action Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-teal-500/30  space-y-6">
          {decisions.map((dec, idx) => (
            <motion.div
              key={dec.decision_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative glass-card p-5 rounded-2xl border border-slate-200  shadow-sm space-y-3"
            >
              {/* Timeline Pin Indicator */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-6 w-5 h-5 rounded-full bg-teal-600 border-4 border-white  shadow-md flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Top Row: IDs, User, Timestamp */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100  pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-teal-600  bg-teal-50  px-2.5 py-1 rounded-lg border border-teal-200/60 ">
                    {dec.decision_id}
                  </span>
                  {dec.shipment_id && (
                    <span className="text-xs font-mono font-bold text-slate-700 ">
                      Target: {dec.shipment_id}
                    </span>
                  )}
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-slate-100  text-slate-600 ">
                    {dec.scope}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-2xs text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-600 ">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {dec.user_name} ({dec.user_email})
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(dec.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Title & Rationale */}
              <div>
                <h4 className="text-sm font-extrabold text-slate-900  flex items-center gap-2">
                  {dec.action_title}
                </h4>
                <div className="mt-2 p-3 rounded-xl bg-slate-50  border border-slate-100 ">
                  <p className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Manager Rationale (Logged):
                  </p>
                  <p className="text-xs text-slate-800  italic leading-relaxed">
                    "{dec.rationale}"
                  </p>
                </div>
              </div>

              {/* Trade-offs & Expected Effect */}
              {(dec.expected_effect || dec.trade_offs) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs pt-1">
                  {dec.expected_effect && (
                    <div className="p-2 rounded-lg bg-teal-50/60  text-teal-900 ">
                      <span className="font-bold">Projected Effect:</span> {dec.expected_effect}
                    </div>
                  )}
                  {dec.trade_offs && (
                    <div className="p-2 rounded-lg bg-slate-100/70  text-slate-700 ">
                      <span className="font-bold">Trade-Offs:</span> {dec.trade_offs}
                    </div>
                  )}
                </div>
              )}

              {/* Status & Outcome Verification */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100  text-xs">
                <span
                  className={`font-bold px-2.5 py-1 rounded-lg text-2xs flex items-center gap-1.5 ${
                    dec.status === 'Verified'
                      ? 'bg-emerald-100 text-emerald-700  '
                      : 'bg-amber-100 text-amber-700  '
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status: {dec.status}
                </span>

                {dec.status !== 'Verified' && (
                  <div>
                    {verifyingId === dec.decision_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-2xs text-slate-500">Actual Delay (days):</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={actualDelayInput}
                          onChange={(e) => setActualDelayInput(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200  text-xs text-center"
                        />
                        <button
                          onClick={() => handleVerifyOutcome(dec.decision_id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-2xs shadow-2xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setVerifyingId(null)}
                          className="text-slate-400 text-2xs hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setVerifyingId(dec.decision_id);
                          setActualDelayInput(0);
                        }}
                        className="text-2xs font-bold text-teal-600  hover:underline flex items-center gap-1"
                      >
                        Verify Delivery Outcome <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <FooterNotice />
    </div>
  );
};
