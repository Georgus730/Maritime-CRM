import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  GitBranch, 
  Settings, 
  LogOut,
  Menu,
  X,
  Anchor,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../utils/helpers';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/sailors', icon: Users, label: t('sailors') },
    { to: '/companies', icon: Building2, label: t('companies') },
    { to: '/vacancies', icon: Briefcase, label: t('vacancies') },
    { to: '/contracts', icon: FileText, label: t('contracts') },
    { to: '/pipeline', icon: GitBranch, label: t('pipeline') },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-maritime-card rounded-md border border-slate-800"
        data-testid="sidebar-toggle"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-maritime-sidebar border-r border-slate-800 flex flex-col transition-transform duration-300",
          !sidebarOpen && "-translate-x-full md:translate-x-0 md:w-20"
        )}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Anchor className="text-primary" size={24} />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-heading text-xl font-bold text-white">MaritimeCRM</h1>
                <p className="text-xs text-slate-500">Maritime Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )
              }
              data-testid={`nav-${item.to.replace('/', '') || 'dashboard'}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-800">
          {user && sidebarOpen && (
            <div className="mb-4 px-4 py-2">
              <p className="text-sm font-medium text-slate-200 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded">
                {user.role}
              </span>
            </div>
          )}
          
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors mb-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
            data-testid="nav-settings"
          >
            <Settings size={20} />
            {sidebarOpen && <span>{t('settings')}</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
            data-testid="logout-btn"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-maritime-card/50 border-b border-slate-800 flex items-center justify-end px-6 gap-4 backdrop-blur-sm">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm"
            data-testid="language-toggle"
          >
            <Globe size={16} />
            <span className="font-mono">{language.toUpperCase()}</span>
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

