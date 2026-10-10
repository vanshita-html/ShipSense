import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  Eye,
  EyeOff,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/notificationStore';
import { AuthIllustration } from '../components/auth/AuthIllustration';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Operations Manager' | 'Analyst'>('Operations Manager');
  const [companyName, setCompanyName] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, register, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Valid corporate email required.';
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        newErrors.fullName = 'Full name required.';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login({ email: email.trim(), password });
        toast.success('Welcome back to ShipSense!', 'Authenticated');
        navigate('/');
      } else {
        await register({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
          confirm_password: confirmPassword,
          role,
          company_name: companyName.trim() || undefined,
        });
        toast.success('Account created successfully!', 'Welcome to ShipSense');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please check credentials.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.info('If an account exists, a reset link was dispatched to the server logs.', 'Reset Link Sent');
    setShowForgotModal(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-linear-to-tr from-teal-50/70 via-slate-50 to-emerald-50/50 relative overflow-hidden font-sans">
      {/* Subtle blurred ambient backdrop shapes */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 right-1/3 w-80 h-80 bg-cyan-100/30 rounded-full blur-2xl pointer-events-none" />

      {/* Centered Auth Card Container: Fixed height on desktop to prevent jumping */}
      <div className="w-full max-w-[1200px] min-w-0 md:min-w-[900px] md:w-[70vw] md:h-[650px] bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 overflow-hidden relative z-10 flex flex-col md:flex-row my-auto">
        
        {/* LEFT 50% ILLUSTRATION PANEL */}
        <div className="w-full md:w-1/2 bg-linear-to-b from-teal-50/80 via-emerald-50/40 to-teal-50/60 p-6 lg:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 relative md:h-full">
          {/* Top Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-teal-600 to-teal-500 p-0.5 shadow-sm flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              ShipSense <span className="text-teal-600 text-xs font-bold uppercase tracking-wider">AI</span>
            </span>
          </div>

          {/* Center Illustration */}
          <div className="my-auto py-2 flex items-center justify-center">
            <AuthIllustration />
          </div>

          {/* Bottom Tagline & Supporting Copy */}
          <div className="pt-2">
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              See delays before they happen.
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              Corridor risk forecasting, SHAP driver explanations, and ranked prescriptive mitigation actions.
            </p>
          </div>
        </div>

        {/* RIGHT 50% COMPACT FORM PANEL */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white md:h-full overflow-y-auto">
          <div className="w-full max-w-md mx-auto">
            {/* Sliding Toggle: Sign In / Create Account */}
            <div className="p-1 rounded-2xl bg-slate-100 flex mb-5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setErrors({});
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isLogin
                    ? 'bg-white text-teal-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setErrors({});
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  !isLogin
                    ? 'bg-white text-teal-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Header */}
            <div className="mb-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {isLogin ? 'Sign in to Control Tower' : 'Create Manager Account'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isLogin
                  ? 'Enter your corporate credentials to monitor active corridor telemetry.'
                  : 'Get predictive insights and prescriptive actions for your fleet.'}
              </p>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Sign Up Fields */}
              {!isLogin && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Rohan Sharma"
                        className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border ${
                          errors.fullName ? 'border-rose-500' : 'border-slate-200'
                        } text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden transition-colors`}
                      />
                    </div>
                    {errors.fullName && <p className="text-3xs text-rose-500 mt-0.5">{errors.fullName}</p>}
                  </div>

                  {/* Role + Company on ONE row */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Role *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden font-medium cursor-pointer"
                      >
                        <option value="Operations Manager">Manager</option>
                        <option value="Analyst">Analyst</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Company
                      </label>
                      <div className="relative">
                        <Building className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Apex Logistics"
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Corporate Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@shipsense.ai"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border ${
                      errors.email ? 'border-rose-500' : 'border-slate-200'
                    } text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden transition-colors`}
                  />
                </div>
                {errors.email && <p className="text-3xs text-rose-500 mt-0.5">{errors.email}</p>}
              </div>

              {/* Password Fields */}
              {isLogin ? (
                /* Login: Single password row with forgot link */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-2xs font-semibold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 border ${
                        errors.password ? 'border-rose-500' : 'border-slate-200'
                      } text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-3xs text-rose-500 mt-0.5">{errors.password}</p>}
                </div>
              ) : (
                /* Signup: Password + Confirm Password on ONE row */
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border ${
                          errors.password ? 'border-rose-500' : 'border-slate-200'
                        } text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-3xs text-rose-500 mt-0.5 truncate">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border ${
                          errors.confirmPassword ? 'border-rose-500' : 'border-slate-200'
                        } text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-hidden`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-3xs text-rose-500 mt-0.5 truncate">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-2.5 rounded-xl bg-linear-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {/* Divider & Disabled Google Button */}
              <div className="pt-2">
                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-3 text-xs text-slate-400 font-normal lowercase">
                    or
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  title="SSO / Google authentication coming soon for enterprise domains"
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google (coming soon)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-black text-slate-900">Reset Password</h4>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Enter your account email. Password recovery instructions will be logged to the server telemetry log.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="manager@shipsense.ai"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Dispatch Reset Link
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
