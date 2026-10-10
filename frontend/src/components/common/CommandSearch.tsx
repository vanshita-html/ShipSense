import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Package,
  Activity,
  Zap,
  BookOpen,
  Sliders,
  CheckSquare,
  History,
  X,
} from 'lucide-react';

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandSearch: React.FC<CommandSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const navigationItems = [
    { title: 'Control Tower (India Map)', path: '/', icon: MapPin },
    { title: 'Shipments Telemetry Explorer', path: '/shipments', icon: Package },
    { title: 'Risk Radar & Heatmap', path: '/radar', icon: Activity },
    { title: 'Action Board (Mitigation Tasks)', path: '/actions', icon: Zap },
    { title: 'Decision Ledger & Audit Trail', path: '/ledger', icon: History },
    { title: 'What-If Simulation Sandbox', path: '/simulator', icon: Sliders },
    { title: 'Model Monitor & Drift Stats', path: '/monitor', icon: Activity },
    { title: 'AI Pipeline Orchestrator', path: '/pipeline', icon: CheckSquare },
    { title: 'About & System Architecture', path: '/about', icon: BookOpen },
  ];

  const filteredItems = navigationItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.path.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          className="w-full max-w-xl rounded-2xl glass-card bg-white border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
            <Search className="w-5 h-5 text-teal-600 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search corridors, shipments, or views... (ESC to close)"
              autoFocus
              className="w-full bg-transparent border-none outline-hidden text-slate-900 placeholder-slate-400 text-sm"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2">
            <p className="px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400">
              Quick Navigation
            </p>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-teal-50 text-slate-700 group transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-teal-100 text-teal-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{item.path}</span>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-sm text-slate-400">
                No matching corridors or navigation commands found.
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
            <span>Press <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 font-mono text-slate-700 font-semibold">↵</kbd> to select</span>
            <span><kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 font-mono text-slate-700 font-semibold">Ctrl+K</kbd> to toggle</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
