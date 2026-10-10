import React from 'react';
import { RISK_COLORS } from '../../constants/theme';

interface RiskBadgeProps {
  band: 'Low' | 'Medium' | 'High' | 'Critical' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ band, size = 'md', className = '' }) => {
  const getBadgeConfig = () => {
    switch (band?.toUpperCase()) {
      case 'CRITICAL':
        return {
          style: 'bg-red-50 text-red-700 border-red-200',
          dotColor: RISK_COLORS.Critical,
        };
      case 'HIGH':
        return {
          style: 'bg-orange-50 text-orange-700 border-orange-200',
          dotColor: RISK_COLORS.High,
        };
      case 'MEDIUM':
        return {
          style: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          dotColor: RISK_COLORS.Medium,
        };
      case 'LOW':
      default:
        return {
          style: 'bg-green-50 text-green-700 border-green-200',
          dotColor: RISK_COLORS.Low,
        };
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-3xs font-bold';
      case 'lg':
        return 'px-3.5 py-1.5 text-xs font-black';
      case 'md':
      default:
        return 'px-2.5 py-0.5 text-2xs font-extrabold';
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wider uppercase shadow-2xs whitespace-nowrap select-none ${config.style} ${getSize()} ${className}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: config.dotColor }}
      />
      <span>{band || 'Low'}</span>
    </span>
  );
};
