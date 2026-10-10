import React from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
  Database,
  Compass,
  Zap,
  History,
  CheckCircle2,
} from 'lucide-react';
import { FooterNotice } from '../components/common/FooterNotice';

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Core Idea Walkthrough */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-slate-200  text-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-teal-100  text-teal-600 flex items-center justify-center font-bold">
            1
          </div>
          <h4 className="font-extrabold text-slate-900 ">Predict</h4>
          <p className="text-slate-500 text-2xs">
            XGBoost classifier predicts delay probability; XGBoost regressor estimates delay duration in days.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200  text-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-sky-100  text-sky-600 flex items-center justify-center font-bold">
            2
          </div>
          <h4 className="font-extrabold text-slate-900 ">Explain</h4>
          <p className="text-slate-500 text-2xs">
            SHAP TreeExplainer identifies positive and negative risk drivers in plain English.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200  text-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100  text-amber-600 flex items-center justify-center font-bold">
            3
          </div>
          <h4 className="font-extrabold text-slate-900 ">Prescribe</h4>
          <p className="text-slate-500 text-2xs">
            Prescriptive engine generates ranked mitigation actions with quantified cost/time trade-offs.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200  text-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100  text-purple-600 flex items-center justify-center font-bold">
            4
          </div>
          <h4 className="font-extrabold text-slate-900 ">Record Rationale</h4>
          <p className="text-slate-500 text-2xs">
            Managers record explicit rationale to commit actions into the append-only audit ledger.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200  text-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100  text-emerald-600 flex items-center justify-center font-bold">
            5
          </div>
          <h4 className="font-extrabold text-slate-900 ">Closed Loop</h4>
          <p className="text-slate-500 text-2xs">
            Verified delivery outcomes check prediction calibration and feed drift monitoring metrics.
          </p>
        </div>
      </div>

      {/* Tech Stack & Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Architecture Details */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200  shadow-md space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900  flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            System Architecture & Pipeline Flow
          </h3>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-2xs font-mono space-y-1.5 leading-relaxed overflow-x-auto">
            <p className="text-teal-400 font-bold">[Live Telemetry Stream / Scenario Simulator]</p>
            <p>   ↓ Ingestion & Schema Assertion</p>
            <p className="text-sky-400">[XGBoost Classifier + XGBoost Regressor (70/15/15 Split)]</p>
            <p>   ↓ Delay Probability & Expected Delay Days</p>
            <p className="text-purple-400">[SHAP TreeExplainer & Feature Attribution Engine]</p>
            <p>   ↓ Plain English Driver Synthesis & Similarity KNN</p>
            <p className="text-amber-400">[Prescriptive Engine & Multi-Factor Trade-Off Matrix]</p>
            <p>   ↓ Advisory Recommendations (Decision Support Mode)</p>
            <p className="text-emerald-400">[Manager Decision Ledger (Append-Only SQLite Audit Trail)]</p>
            <p>   ↓ Delivery Verification & Closed-Loop Calibration</p>
            <p className="text-rose-400">[PSI Feature Drift Surveillance & Model Health Checks]</p>
          </div>
        </div>

        {/* Tech Stack Breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200  shadow-md space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900  flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-600" />
            Technology Stack Specifications
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 ">
              <span className="font-bold text-slate-900 ">Backend Subsystem:</span>
              <p className="text-slate-500 text-2xs mt-0.5">
                FastAPI, Python 3.12, SQLAlchemy ORM, SQLite database, Pydantic v2 validation, JWT authentication with httpOnly cookie storage and bcrypt hashing.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 ">
              <span className="font-bold text-slate-900 ">Machine Learning & Explainability:</span>
              <p className="text-slate-500 text-2xs mt-0.5">
                XGBoost 2.1 (Classifier & Regressor), SHAP 0.46 (TreeExplainer), Scikit-Learn 1.6, SciPy (KS-test & PSI), Joblib model persistence.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 ">
              <span className="font-bold text-slate-900 ">Frontend Control Tower UI:</span>
              <p className="text-slate-500 text-2xs mt-0.5">
                React + Vite + TypeScript, Tailwind CSS, Framer Motion, Leaflet interactive map, Recharts data visualizations, Zustand global stores.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Honest Limitations Section */}
      <div className="glass-card p-6 rounded-2xl border border-amber-200  bg-linear-to-r from-amber-50/40 to-transparent  space-y-3">
        <div className="flex items-center gap-2 text-amber-700  font-bold text-xs">
          <ShieldAlert className="w-4 h-4" />
          <span>Honest Platform Disclosures & System Limitations</span>
        </div>
        <div className="space-y-2 text-xs text-slate-700 ">
          <p>
            <strong>1. Synthetic Telemetry:</strong> In the absence of live ERP/carrier GPS feeds, ShipSense generates 5,000+ realistic synthetic logistics records modeled on Indian transport physics and corridor geographies.
          </p>
          <p>
            <strong>2. Decision Support Mode:</strong> Prescriptive actions are strictly advisory recommendations. The system never executes supplier reallocations or route changes autonomously.
          </p>
          <p>
            <strong>3. Enterprise Integration:</strong> In a production deployment, telemetry feeds would interface with SAP/Oracle TMS, FASTag toll transponders, and maritime AIS feeds via Kafka/MQTT.
          </p>
        </div>
      </div>

      <FooterNotice />
    </div>
  );
};
