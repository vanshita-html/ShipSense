import React, { useState, useEffect } from 'react';
import {
  Sliders,
  User,
  Lock,
  Radio,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/authApi';
import { simulationApi } from '../services/simulationApi';
import { SimulationStatus } from '../types';
import { toast } from '../store/notificationStore';
import { FooterNotice } from '../components/common/FooterNotice';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [simStatus, setSimStatus] = useState<SimulationStatus | null>(null);
  const [selectedScenario, setSelectedScenario] = useState('NORMAL');
  const [intervalSec, setIntervalSec] = useState(5);

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fetchSimStatus = async () => {
    try {
      const res = await simulationApi.getStatus();
      setSimStatus(res);
      setSelectedScenario(res.current_scenario);
      setIntervalSec(res.interval_sec);
    } catch (err) {
      console.error('Failed to load simulation settings:', err);
    }
  };

  useEffect(() => {
    fetchSimStatus();
  }, []);

  const handleScenarioChange = async (scenarioKey: string) => {
    try {
      await simulationApi.setScenario(scenarioKey);
      setSelectedScenario(scenarioKey);
      toast.success(`Active scenario switched to ${scenarioKey}.`, 'Simulator Updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to switch scenario.');
    }
  };

  const handleIntervalSave = async () => {
    try {
      await simulationApi.setInterval(intervalSec);
      toast.success(`Telemetry sync interval set to ${intervalSec}s.`, 'Interval Saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save interval.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      toast.success('Password updated successfully.', 'Security Updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator Settings */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200  shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100  pb-3">
            <h3 className="text-sm font-extrabold text-slate-900  flex items-center gap-2">
              <Radio className="w-4 h-4 text-teal-600" />
              Live Telemetry Simulator Controls
            </h3>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700  ">
              Active Background Stream
            </span>
          </div>

          {/* Scenario Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 ">
              Active Disruption Scenario Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {simStatus?.available_scenarios?.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleScenarioChange(s.key)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedScenario === s.key
                      ? 'bg-teal-50  border-teal-500 ring-2 ring-teal-500/20 text-slate-900 '
                      : 'bg-white  border-slate-200  text-slate-600  hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold">{s.name}</p>
                  <p className="text-2xs opacity-80 mt-1 leading-snug">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Ingestion Speed Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-100 ">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 ">
                Telemetry Generation Frequency
              </span>
              <span className="font-mono font-bold text-teal-600">Every {intervalSec} Seconds</span>
            </div>
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={intervalSec}
              onChange={(e) => setIntervalSec(parseInt(e.target.value, 10))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-3xs text-slate-400">
              <span>Fast (2s)</span>
              <span>Slow (30s)</span>
            </div>
            <button
              onClick={handleIntervalSave}
              className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply Sync Speed</span>
            </button>
          </div>
        </div>

        {/* Profile & Security Settings */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200  shadow-md space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900  flex items-center gap-2 border-b border-slate-100  pb-3">
              <User className="w-4 h-4 text-teal-600" />
              Manager Profile Information
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-2xs text-slate-400 block">Full Name</span>
                <span className="font-bold text-slate-900 ">{user?.full_name}</span>
              </div>

              <div>
                <span className="text-2xs text-slate-400 block">Corporate Email</span>
                <span className="font-bold text-slate-900 ">{user?.email}</span>
              </div>

              <div>
                <span className="text-2xs text-slate-400 block">Assigned Role</span>
                <span className="font-semibold text-teal-600 ">{user?.role}</span>
              </div>

              <div>
                <span className="text-2xs text-slate-400 block">Company</span>
                <span className="font-bold text-slate-900 ">{user?.company_name || 'Enterprise'}</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200  shadow-md space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900  flex items-center gap-2 border-b border-slate-100  pb-3">
              <Lock className="w-4 h-4 text-teal-600" />
              Update Password
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700  mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700  mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700  mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50  border border-slate-200  outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-60"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Save New Password</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      <FooterNotice />
    </div>
  );
};
