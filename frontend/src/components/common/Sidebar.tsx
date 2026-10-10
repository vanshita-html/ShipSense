import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Package,
  Activity,
  Zap,
  History,
  Sliders,
  LineChart,
  CheckSquare,
  BookOpen,
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const NAV_ITEMS = [
  { label: 'Control Tower', path: '/', icon: Compass },
  { label: 'Shipments', path: '/shipments', icon: Package },
  { label: 'Risk Radar', path: '/radar', icon: Activity },
  { label: 'Action Board', path: '/actions', icon: Zap },
  { label: 'Decision Ledger', path: '/ledger', icon: History },
  { label: 'What-If Sandbox', path: '/simulator', icon: Sliders },
  { label: 'Model Monitor', path: '/monitor', icon: LineChart },
  { label: 'AI Pipeline', path: '/pipeline', icon: CheckSquare },
  { label: 'About', path: '/about', icon: BookOpen },
];

const formatFullName = (name?: string) => {
  const target = name && name.trim() ? name.trim() : 'Vanshita Shivankar';
  return target
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const formatRole = (role?: string) => {
  const target = role && role.trim() ? role.trim() : 'Operations Manager';
  if (/^operations\s*manager$/i.test(target)) {
    return 'Ops Manager';
  }
  return target.replace(/Operations/gi, 'Ops');
};

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('shipsense_sidebar_collapsed', String(next));
  };

  const displayName = formatFullName(user?.full_name);
  const displayRole = formatRole(user?.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/90 shadow-xs flex flex-col justify-between transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Brand Header & Collapse Toggle */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <Link
            to="/"
            onClick={onMobileClose}
            className={`flex items-center gap-2.5 overflow-hidden transition-all ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-teal-600 to-teal-500 p-0.5 shadow-sm flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-base font-black tracking-tight text-slate-900 whitespace-nowrap">
                ShipSense <span className="text-teal-600 text-xs font-bold uppercase tracking-wider">AI</span>
              </span>
            )}
          </Link>

          {/* Desktop Collapse Button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Main Navigation Links */}
        <div className="flex-1 py-3 px-2 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center h-12 px-3 rounded-xl text-xs font-semibold transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-bold border-l-[3px] border-teal-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-[3px] border-transparent'
                } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section: Collapse expander, Settings, User Block, Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {/* Expand Button (when collapsed) */}
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex w-full items-center justify-center h-10 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Settings Nav Item (Right above user block) */}
          <Link
            to="/settings"
            onClick={onMobileClose}
            title={isCollapsed ? 'Settings' : undefined}
            className={`flex items-center h-11 px-3 rounded-xl text-xs font-semibold transition-all ${
              location.pathname === '/settings'
                ? 'bg-teal-50 text-teal-700 font-bold border-l-[3px] border-teal-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-[3px] border-transparent'
            } ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}
          >
            <SettingsIcon
              className={`w-4 h-4 shrink-0 ${
                location.pathname === '/settings' ? 'text-teal-600' : 'text-slate-400'
              }`}
            />
            {!isCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </Link>

          {/* User Block & Logout */}
          <div
            className={`p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between ${
              isCollapsed ? 'flex-col gap-2 p-1.5 justify-center' : ''
            }`}
          >
            <div className={`flex items-center gap-2.5 overflow-hidden ${isCollapsed ? 'justify-center w-full' : 'min-w-0 flex-1'}`}>
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {displayName ? displayName.charAt(0).toUpperCase() : 'V'}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  <p
                    className="text-xs font-semibold text-slate-900 truncate leading-tight"
                    title={displayName}
                  >
                    {displayName}
                  </p>
                  <p
                    className="text-[11px] text-slate-500 font-normal truncate leading-tight mt-0.5"
                    title={displayRole}
                  >
                    {displayRole}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
