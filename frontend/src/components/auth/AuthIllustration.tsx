import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, History } from 'lucide-react';

export const AuthIllustration: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[360px] flex items-center justify-center p-2 relative select-none">
      <svg
        viewBox="0 0 540 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[420px] max-h-[320px] drop-shadow-sm"
      >
        <defs>
          <linearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
          <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0F172A" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Faded Background Browser Window Cards */}
        <g opacity="0.65" filter="url(#softShadow)">
          <rect x="70" y="45" width="220" height="135" rx="14" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          {/* Browser header */}
          <rect x="70" y="45" width="220" height="26" rx="14" fill="#F8FAFC" />
          <circle cx="88" cy="58" r="4" fill="#FDA4AF" />
          <circle cx="102" cy="58" r="4" fill="#FDE047" />
          <circle cx="116" cy="58" r="4" fill="#86EFAC" />
          {/* Card mock lines */}
          <rect x="90" y="85" width="110" height="8" rx="4" fill="#CBD5E1" />
          <rect x="90" y="101" width="160" height="6" rx="3" fill="#E2E8F0" />
          <rect x="90" y="115" width="130" height="6" rx="3" fill="#E2E8F0" />
          <rect x="90" y="135" width="70" height="18" rx="6" fill="#CCFBF1" />
          <rect x="98" y="141" width="40" height="6" rx="3" fill="#0D9488" />
        </g>

        <g opacity="0.5" filter="url(#softShadow)">
          <rect x="250" y="70" width="210" height="110" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
          <rect x="268" y="90" width="90" height="7" rx="3.5" fill="#CBD5E1" />
          <rect x="268" y="105" width="130" height="6" rx="3" fill="#F1F5F9" />
          {/* mini bar graph */}
          <rect x="380" y="140" width="8" height="24" rx="2" fill="#14B8A6" />
          <rect x="394" y="125" width="8" height="39" rx="2" fill="#0D9488" />
          <rect x="408" y="132" width="8" height="32" rx="2" fill="#2DD4BF" />
          <rect x="422" y="115" width="8" height="49" rx="2" fill="#047857" />
        </g>

        {/* Security Padlock on top of device frame */}
        <g filter="url(#softShadow)">
          <rect x="325" y="48" width="42" height="34" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          <path d="M336 48V40C336 34.5 340.5 30 346 30C351.5 30 356 34.5 356 40V48" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" />
          <circle cx="346" cy="63" r="3.5" fill="#0D9488" />
          <path d="M346 66.5V72" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Central Smartphone Device */}
        <g filter="url(#softShadow)">
          {/* Phone body */}
          <rect x="190" y="75" width="160" height="290" rx="26" fill="url(#phoneGrad)" stroke="#334155" strokeWidth="3" />
          {/* Screen */}
          <rect x="198" y="85" width="144" height="270" rx="20" fill="url(#screenGrad)" />
          {/* Phone speaker notch */}
          <rect x="245" y="92" width="50" height="4" rx="2" fill="#94A3B8" />

          {/* Screen Content: Auth UI Mockup */}
          <rect x="250" y="110" width="40" height="40" rx="12" fill="url(#tealGrad)" />
          <circle cx="270" cy="130" r="8" fill="#FFFFFF" opacity="0.9" />
          <path d="M268 126L274 130L268 134" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="226" y="162" width="88" height="8" rx="4" fill="#0F172A" />
          <rect x="236" y="176" width="68" height="5" rx="2.5" fill="#94A3B8" />

          {/* Form fields */}
          <rect x="214" y="196" width="112" height="24" rx="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="225" cy="208" r="4" fill="#94A3B8" />
          <rect x="235" y="205" width="60" height="6" rx="3" fill="#E2E8F0" />

          <rect x="214" y="228" width="112" height="24" rx="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="225" cy="240" r="4" fill="#94A3B8" />
          <circle cx="236" cy="240" r="2.5" fill="#64748B" />
          <circle cx="244" cy="240" r="2.5" fill="#64748B" />
          <circle cx="252" cy="240" r="2.5" fill="#64748B" />
          <circle cx="260" cy="240" r="2.5" fill="#64748B" />

          {/* Sign In CTA button */}
          <rect x="214" y="262" width="112" height="26" rx="8" fill="url(#tealGrad)" />
          <rect x="246" y="272" width="48" height="6" rx="3" fill="#FFFFFF" />

          {/* Social login line */}
          <rect x="230" y="300" width="80" height="4" rx="2" fill="#CBD5E1" />
        </g>

        {/* Potted Plant / Leaf Element (Right) */}
        <g>
          {/* Pot */}
          <path d="M380 340L386 380H420L426 340H380Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
          {/* Leaves */}
          <path
            d="M403 340C392 312 370 308 365 312C360 322 384 335 403 340Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M403 340C407 302 432 298 437 305C442 314 418 333 403 340Z"
            fill="#10B981"
          />
          <path
            d="M403 340C397 292 407 278 413 281C419 288 410 321 403 340Z"
            fill="#34D399"
          />
        </g>

        {/* Friendly Person Standing & Interacting (Left side) */}
        <g>
          {/* Legs */}
          <path d="M142 270L145 385" stroke="#1E293B" strokeWidth="11" strokeLinecap="round" />
          <path d="M162 270L168 385" stroke="#1E293B" strokeWidth="11" strokeLinecap="round" />
          {/* Shoes */}
          <path d="M138 385H154C157 385 160 388 160 391V393H134V389C134 386 136 385 138 385Z" fill="#0D9488" />
          <path d="M162 385H178C181 385 184 388 184 391V393H158V389C158 386 160 385 162 385Z" fill="#0D9488" />

          {/* Torso / Jacket */}
          <path
            d="M132 205C132 188 145 180 160 180C175 180 186 188 186 205V275H132V205Z"
            fill="#0F766E"
          />
          {/* Inner shirt */}
          <path d="M152 180H166L164 220H154L152 180Z" fill="#F8FAFC" />

          {/* Head & Hair */}
          <circle cx="158" cy="155" r="16" fill="#FDBA74" />
          {/* Friendly dark hair */}
          <path
            d="M144 153C144 142 150 137 160 137C172 137 176 145 176 150C171 150 167 146 159 146C152 146 148 149 144 153Z"
            fill="#1E293B"
          />
          {/* Smile */}
          <path d="M162 158C164 160 168 160 170 158" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />

          {/* Arm interacting with the phone */}
          <path
            d="M175 205C185 212 198 214 212 216"
            stroke="#0F766E"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="214" cy="216" r="4.5" fill="#FDBA74" />

          {/* Left relaxed arm */}
          <path
            d="M136 205C128 220 126 235 128 250"
            stroke="#0F766E"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="129" cy="252" r="4.5" fill="#FDBA74" />
        </g>
      </svg>

      {/* 3 Outer Edge Feature Cards with gentle floating animation */}
      {/* 1. Top-Right: SHAP Explainability */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-2 max-w-[190px] z-10"
      >
        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xs font-extrabold text-slate-900 leading-tight">SHAP Explainability</p>
          <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
            See why a shipment is risky
          </p>
        </div>
      </motion.div>

      {/* 2. Left-Middle Edge: Ranked Actions */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute top-1/2 -translate-y-1/2 left-1 sm:left-2 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-2 max-w-[190px] z-10"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xs font-extrabold text-slate-900 leading-tight">Ranked Actions</p>
          <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
            Prioritised mitigation options
          </p>
        </div>
      </motion.div>

      {/* 3. Bottom-Right: Decision Ledger */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white/95 backdrop-blur-xs p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-2 max-w-[190px] z-10"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <History className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xs font-extrabold text-slate-900 leading-tight">Decision Ledger</p>
          <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
            Audit trail of every decision
          </p>
        </div>
      </motion.div>
    </div>
  );
};
