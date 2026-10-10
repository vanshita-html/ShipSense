import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlightVariant?: 'default' | 'teal' | 'amber' | 'coral' | 'emerald';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  highlightVariant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (highlightVariant) {
      case 'coral':
        return 'border-l-4 border-l-rose-500 text-rose-600';
      case 'amber':
        return 'border-l-4 border-l-amber-500 text-amber-600';
      case 'emerald':
        return 'border-l-4 border-l-emerald-500 text-emerald-600';
      case 'teal':
        return 'border-l-4 border-l-teal-500 text-teal-600';
      default:
        return 'border-l-4 border-l-slate-300 text-slate-700';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`glass-card p-5 rounded-2xl relative overflow-hidden transition-all duration-200 ${getVariantStyles()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
          {label}
        </span>
        <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
          {value}
        </span>
        {trend && (
          <span
            className={`text-2xs font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
              trend.isPositive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-rose-100 text-rose-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {subtext}
        </p>
      )}
    </motion.div>
  );
};
