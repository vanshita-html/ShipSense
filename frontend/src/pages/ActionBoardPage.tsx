import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Zap,
  Shield,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Send,
} from 'lucide-react';
import { shipmentApi } from '../services/shipmentApi';
import { decisionApi } from '../services/decisionApi';
import { KanbanCard, Recommendation } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { toast } from '../store/notificationStore';
import { FooterNotice } from '../components/common/FooterNotice';

export const ActionBoardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardForCommit, setSelectedCardForCommit] = useState<KanbanCard | null>(null);
  const [managerRationale, setManagerRationale] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  const fetchActionCards = async () => {
    try {
      const activeCards = await shipmentApi.getAllActionCards();
      setCards(activeCards);
    } catch (err) {
      console.error('Failed to load action cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActionCards();
  }, []);

  const moveCard = (cardId: string, targetColumn: KanbanCard['board_column']) => {
    if (targetColumn === 'COMMITTED') {
      const card = cards.find((c) => c.id === cardId);
      if (card) {
        setSelectedCardForCommit(card);
        setManagerRationale(
          `Approved mitigation: Executing ${card.action.title} to resolve high ${card.corridor} delay risk.`
        );
      }
      return;
    }

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, board_column: targetColumn } : c))
    );
  };

  const handleCommitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardForCommit || managerRationale.trim().length < 10) {
      toast.error('Please enter a comprehensive manager rationale (min 10 characters).');
      return;
    }

    setIsCommitting(true);
    try {
      await decisionApi.createDecision({
        scope: 'Single Shipment',
        shipment_id: selectedCardForCommit.shipment_id,
        action_code: selectedCardForCommit.action.action_code,
        action_title: selectedCardForCommit.action.title,
        rationale: managerRationale.trim(),
        ai_recommendation_rank: 1,
        expected_effect: selectedCardForCommit.action.expected_effect,
        trade_offs: `${selectedCardForCommit.action.trade_offs.cost_impact}, ${selectedCardForCommit.action.trade_offs.time_gain}`,
      });

      // Update card state in board to COMMITTED
      setCards((prev) =>
        prev.map((c) =>
          c.id === selectedCardForCommit.id ? { ...c, board_column: 'COMMITTED' } : c
        )
      );

      // Trigger Confetti
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 },
      });

      toast.success(
        `Decision committed for ${selectedCardForCommit.shipment_id} and recorded to append-only audit ledger.`,
        'Mitigation Committed'
      );
      setSelectedCardForCommit(null);
      setManagerRationale('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to record decision.', 'Error');
    } finally {
      setIsCommitting(false);
    }
  };

  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});

  const toggleColumnExpanded = (colId: string) => {
    setExpandedColumns((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const columns: Array<{ id: KanbanCard['board_column']; label: string; color: string }> = [
    { id: 'RECOMMENDED', label: 'AI Recommended', color: 'border-t-teal-500' },
    { id: 'UNDER_REVIEW', label: 'Under Review', color: 'border-t-amber-500' },
    { id: 'COMMITTED', label: 'Committed to Ledger', color: 'border-t-indigo-500' },
    { id: 'DONE', label: 'Executed & Verified', color: 'border-t-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Guardrail Notice Banner */}
      <div className="px-4 py-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold text-xs">Decision Support Mode Active</p>
            <p className="text-2xs text-amber-700 mt-0.5">
              The AI never executes mitigations autonomously. All actions require explicit manager sign-off and rationale.
            </p>
          </div>
        </div>
        <span className="text-2xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 shrink-0 w-fit">
          Human-In-The-Loop
        </span>
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="p-16 text-center glass-card rounded-2xl">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Generating prescriptive mitigation cards...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {columns.map((col) => {
            const allColumnCards = cards.filter((c) => c.board_column === col.id);
            // Sort by relevance score
            const sortedCards = [...allColumnCards].sort(
              (a, b) => (b.action?.relevance_score ?? 0) - (a.action?.relevance_score ?? 0)
            );
            const isExpanded = !!expandedColumns[col.id];
            const visibleCards = isExpanded ? sortedCards : sortedCards.slice(0, 10);
            const hasMore = sortedCards.length > 10;

            return (
              <div
                key={col.id}
                className={`glass-card rounded-2xl p-4 border-t-4 ${col.color} flex flex-col min-w-[300px] sm:min-w-[320px] bg-slate-50/60 shadow-sm`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {col.label}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200/90 text-slate-700 text-2xs font-bold">
                    {allColumnCards.length}
                  </span>
                </div>

                {/* Independent Scrollable Cards Container with fixed max height */}
                <div className="space-y-3.5 my-3 max-h-[640px] overflow-y-auto pr-1">
                  {visibleCards.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      No cards in this column
                    </div>
                  ) : (
                    visibleCards.map((card) => (
                      <motion.div
                        key={card.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl glass-card bg-white border border-slate-200/90 shadow-sm space-y-3 hover:border-teal-500/50 transition-all"
                      >
                        {/* Card Header: ID & Relevance Match */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                            {card.shipment_id}
                          </span>
                          <span className="text-2xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            {card.action.relevance_score}% Match
                          </span>
                        </div>

                        {/* Action Title (16px semibold/bold) & Rationale (13-14px muted) */}
                        <div>
                          <h4 className="text-[15px] sm:text-base font-bold text-slate-900 leading-snug tracking-tight">
                            {card.action.title}
                          </h4>
                          <p className="text-xs sm:text-[13px] text-slate-600 mt-1.5 font-normal leading-relaxed">
                            {card.action.rationale}
                          </p>
                        </div>

                        {/* Expected Effect Badge */}
                        <div className="p-2.5 rounded-lg bg-teal-50/80 border border-teal-200/60 text-teal-900 text-xs font-semibold flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="leading-snug">{card.action.expected_effect}</span>
                        </div>

                        {/* Trade-Off Matrix */}
                        <div className="grid grid-cols-2 gap-2 text-2xs pt-2 border-t border-slate-100">
                          <div className="text-slate-500">
                            Cost: <span className="font-bold text-slate-900">{card.action.trade_offs.cost_impact}</span>
                          </div>
                          <div className="text-slate-500">
                            Time: <span className="font-bold text-slate-900">{card.action.trade_offs.time_gain}</span>
                          </div>
                        </div>

                        {/* Stage Transition Buttons */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          {col.id === 'RECOMMENDED' && (
                            <button
                              onClick={() => moveCard(card.id, 'UNDER_REVIEW')}
                              className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Move to Review
                            </button>
                          )}

                          {col.id === 'UNDER_REVIEW' && (
                            <div className="w-full flex gap-2">
                              <button
                                onClick={() => moveCard(card.id, 'RECOMMENDED')}
                                className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                              >
                                Back
                              </button>
                              <button
                                onClick={() => moveCard(card.id, 'COMMITTED')}
                                className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
                              >
                                Commit Action
                              </button>
                            </div>
                          )}

                          {col.id === 'COMMITTED' && (
                            <button
                              onClick={() => moveCard(card.id, 'DONE')}
                              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mark Executed
                            </button>
                          )}

                          {col.id === 'DONE' && (
                            <span className="w-full text-center py-1.5 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Logged & Verified
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Show More / Show Less Button */}
                {hasMore && (
                  <button
                    onClick={() => toggleColumnExpanded(col.id)}
                    className="w-full py-1.5 mt-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-2xs font-bold transition-colors cursor-pointer"
                  >
                    {isExpanded
                      ? 'Show Less'
                      : `Show More (${sortedCards.length - 10} more)`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Manager Rationale Modal */}
      {selectedCardForCommit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl glass-card bg-white  p-6 border border-slate-200  shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100  pb-3">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-teal-600 ">
                  Manager Sign-Off Required
                </span>
                <h3 className="text-lg font-black text-slate-900  mt-0.5">
                  Commit Mitigation Action
                </h3>
              </div>
              <button
                onClick={() => setSelectedCardForCommit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50  space-y-1 text-xs">
              <p className="font-bold text-slate-900 ">
                {selectedCardForCommit.action.title}
              </p>
              <p className="text-2xs text-slate-500">
                Target Consignment: <span className="font-mono font-bold text-teal-600">{selectedCardForCommit.shipment_id}</span> ({selectedCardForCommit.corridor})
              </p>
              <p className="text-2xs text-emerald-600  font-semibold">
                Expected Effect: {selectedCardForCommit.action.expected_effect}
              </p>
            </div>

            <form onSubmit={handleCommitDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700  mb-1">
                  Manager Decision Rationale (Mandatory Audit Trail) *
                </label>
                <textarea
                  value={managerRationale}
                  onChange={(e) => setManagerRationale(e.target.value)}
                  rows={4}
                  required
                  placeholder="Document business justification, carrier SLA authorization, and operational context..."
                  className="w-full p-3 rounded-xl bg-white  border border-slate-200  text-xs text-slate-900  placeholder-slate-400 focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
                <p className="text-2xs text-slate-400 mt-1">
                  This justification will be permanently immutably written to the Decision Audit Ledger.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 ">
                <button
                  type="button"
                  onClick={() => setSelectedCardForCommit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCommitting}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isCommitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Commit to Audit Ledger</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FooterNotice />
    </div>
  );
};
