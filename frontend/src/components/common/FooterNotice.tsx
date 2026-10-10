import React from 'react';
import { Database, Shield } from 'lucide-react';

export const FooterNotice: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 py-4 px-2 mt-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <span className="whitespace-nowrap">Simulated shipment telemetry across Indian multimodal logistics corridors.</span>
      </div>
      <div className="flex items-center gap-3 text-2xs text-slate-400 whitespace-nowrap">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-emerald-500" />
          Decision Support Mode
        </span>
        <span>•</span>
        <span>ShipSense v1.0.0</span>
      </div>
    </footer>
  );
};
