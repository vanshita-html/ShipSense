import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Sidebar } from './components/common/Sidebar';
import { PageHeader } from './components/common/PageHeader';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthPage } from './pages/AuthPage';
import { ControlTowerPage } from './pages/ControlTowerPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { RiskRadarPage } from './pages/RiskRadarPage';
import { ActionBoardPage } from './pages/ActionBoardPage';
import { DecisionLedgerPage } from './pages/DecisionLedgerPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { ModelMonitorPage } from './pages/ModelMonitorPage';
import { PipelinePage } from './pages/PipelinePage';
import { AboutPage } from './pages/AboutPage';
import { SettingsPage } from './pages/SettingsPage';

const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Control Tower',
    subtitle: 'Real-time AI telemetry and corridor disruption tracking across India',
  },
  '/shipments': {
    title: 'Shipments Telemetry',
    subtitle: 'Active freight consignments with XGBoost delay risk and SHAP explainability',
  },
  '/radar': {
    title: 'Risk Radar',
    subtitle: 'Corridor-level vulnerability index and high-risk cargo clusters',
  },
  '/actions': {
    title: 'Action Board',
    subtitle: 'Prescriptive mitigation recommendations and manager decision workflow',
  },
  '/ledger': {
    title: 'Decision Ledger',
    subtitle: 'Closed-loop audit trail comparing manager decisions with actual arrival outcomes',
  },
  '/simulator': {
    title: 'What-If Sandbox',
    subtitle: 'Scenario stress-testing (Monsoon, Port Strike, Fuel Spike) and fleet impact',
  },
  '/monitor': {
    title: 'Model Monitor',
    subtitle: 'Real-time drift detection, PSI metrics, and XGBoost feature stability',
  },
  '/pipeline': {
    title: 'AI Pipeline Orchestrator',
    subtitle: 'Automated data ingestion, feature store, model retraining, and registry',
  },
  '/about': {
    title: 'System Architecture',
    subtitle: 'ShipSense design principles, ML pipeline, and closed-loop learning loops',
  },
  '/settings': {
    title: 'Platform Settings',
    subtitle: 'Telemetry streaming controls, simulation presets, and security',
  },
};

// Dashboard Layout with Left Vertical Sidebar & Slim In-Content Header
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('shipsense_sidebar_collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const currentMeta = ROUTE_META[location.pathname] || {
    title: 'Control Tower',
    subtitle: 'Operational logistics intelligence',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Fixed Left Vertical Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-200 ease-in-out min-w-0 ${
          isCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full min-w-0">
          {/* Slim Page Header Inside Content Area */}
          <PageHeader
            title={currentMeta.title}
            subtitle={currentMeta.subtitle}
            onOpenMobileMenu={() => setIsMobileOpen(true)}
          />

          {/* Active Page View */}
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
};

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

export function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
    // Enforce pure light theme
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('shipsense_theme');
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ControlTowerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shipments"
          element={
            <ProtectedRoute>
              <ShipmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/radar"
          element={
            <ProtectedRoute>
              <RiskRadarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actions"
          element={
            <ProtectedRoute>
              <ActionBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ledger"
          element={
            <ProtectedRoute>
              <DecisionLedgerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulator"
          element={
            <ProtectedRoute>
              <WhatIfPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitor"
          element={
            <ProtectedRoute>
              <ModelMonitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pipeline"
          element={
            <ProtectedRoute>
              <PipelinePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <AboutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Notification Toasts */}
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
