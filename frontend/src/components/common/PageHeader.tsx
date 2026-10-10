import React, { useState } from 'react';
import { Menu, Search, Bell, Radio, CheckCircle2 } from 'lucide-react';
import { CommandSearch } from './CommandSearch';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  onOpenMobileMenu?: () => void;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  actions,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        {/* Left: Mobile Menu Trigger + Title & Subtitle */}
        <div className="flex items-center gap-3.5 min-w-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {title}
            </h1>
            <p className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis mt-0.5 font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Search Box (Ctrl+K), Live Status Chip, Notification Bell, Optional Page Actions */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Quick Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:border-teal-500 hover:text-slate-800 transition-all shadow-2xs text-xs group cursor-pointer"
            title="Search (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
            <span className="hidden sm:inline font-medium text-slate-500">Quick search...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-3xs font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
              Ctrl K
            </kbd>
          </button>

          {/* Compact "Live" Status Chip */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs text-emerald-800 text-xs font-semibold select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="tracking-tight text-xs font-bold text-emerald-700">Live</span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-400 transition-colors shadow-2xs relative"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-900">System Alerts</span>
                  <span className="text-3xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    Real-Time
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">XGBoost Telemetry Ingested</p>
                      <p className="text-2xs text-slate-500 mt-0.5">250 corridor shipments refreshed with active SHAP values.</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5">
                    <Radio className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950 leading-tight">Monsoon Buffer Triggered</p>
                      <p className="text-2xs text-amber-700 mt-0.5">Mumbai-Delhi corridor speed reduced by 14% due to rainfall.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Any extra page-specific actions */}
          {actions}
        </div>
      </header>

      {/* Ctrl+K Search Modal */}
      <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
