import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Mail, Lock, AlertCircle, Globe, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { seedDemoData } from '../utils/api';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const { login, loginAsGuest, register } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRedirecting(false);

    try {
      await login(email, password);
      setRedirecting(true);
      // Give context time to update and navigate
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      setError(t('invalidCredentials') || err.message || 'Login failed');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 8) {
      setRegError(language === 'ru' ? 'Пароль должен быть не менее 8 символов' : 'Password must be at least 8 characters');
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setRegError(language === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match');
      return;
    }

    setRegLoading(true);
    try {
      await register(regEmail, regPassword, regName);
      toast.success(language === 'ru' ? 'Регистрация успешна' : 'Registration successful');
      // Navigate to dashboard
      setTimeout(() => navigate('/'), 300);
    } catch (err) {
      console.error('Register error:', err);
      const msg = err?.response?.data?.detail || err.message || 'Registration failed';
      setRegError(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await seedDemoData();
      toast.success(language === 'ru' ? 'Демо-данные загружены!' : 'Demo data loaded!');
      // If backend returns credentials, prefill
      if (response.data?.credentials?.admin) {
        setEmail(response.data.credentials.admin.email);
        setPassword(response.data.credentials.admin.password);
      }
    } catch (err) {
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'Failed to load data');
    } finally {
      setSeeding(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    setRedirecting(false);

    try {
      await loginAsGuest();
      setRedirecting(true);
      setTimeout(() => navigate('/'), 500);
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка входа как гость' : 'Guest login failed');
      console.error('Guest login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const DEMO_ENABLED = process.env.REACT_APP_ENABLE_DEMO === 'true';

  return (
    <div className="min-h-screen bg-maritime-deep flex flex-col">
      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/50 hover:bg-slate-800 transition-colors text-sm text-slate-300"
          data-testid="login-language-toggle"
        >
          <Globe size={16} />
          <span className="font-mono">{language.toUpperCase()}</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-xl mb-4">
              <Anchor className="text-primary" size={48} />
            </div>
            <h1 className="font-heading text-4xl font-bold text-white">MaritimeCRM</h1>
            <p className="text-slate-500 mt-2">
              {language === 'ru' ? 'Система управления морскими экипажами' : 'Maritime Crew Management System'}
            </p>
          </div>

          {/* Login and registration form container */}
          <div className="bg-maritime-card border border-slate-800 rounded-md p-8 shadow-card">
            <h2 className="font-heading text-2xl font-semibold text-white mb-6">{t('login')}</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-md flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="admin@maritimecrm.com"
                    required
                    data-testid="login-email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20"
                    placeholder="••••••••"
                    required
                    data-testid="login-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || redirecting}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-md shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="login-submit"
              >
                {redirecting ? (language === 'ru' ? 'Перенаправление...' : 'Redirecting...') : 
                 loading ? (language === 'ru' ? 'Вход...' : 'Signing in...') : t('signIn')}
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading || redirecting}
                className="w-full mt-3 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="guest-login-btn"
              >
                {loading ? (language === 'ru' ? 'Вход...' : 'Signing in...') : 
                 (language === 'ru' ? 'Войти как гость' : 'Guest Login')}
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-3">
              {language === 'ru' 
                ? 'Гость может просматривать данные, но не может удалять или изменять настройки' 
                : 'Guest can view data but cannot delete or change settings'}
            </p>

            {/* Registration */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-white font-medium mb-4">{language === 'ru' ? 'Регистрация' : 'Register'}</h3>

              {regError && (
                <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-md flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {regError}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{language === 'ru' ? 'Имя' : 'Full name'}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder={language === 'ru' ? 'Иван Иванов' : 'John Smith'}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{language === 'ru' ? 'Подтвердите пароль' : 'Confirm password'}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="password"
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {regLoading ? (language === 'ru' ? 'Регистрация...' : 'Registering...') : (language === 'ru' ? 'Зарегистрироваться' : 'Register')}
                </button>
              </form>
            </div>

            {/* Demo data button */}
            {DEMO_ENABLED && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-md transition-colors disabled:opacity-50"
                  data-testid="seed-demo-btn"
                >
                  {seeding 
                    ? (language === 'ru' ? 'Загрузка...' : 'Loading...') 
                    : (language === 'ru' ? 'Загрузить демо-данные' : 'Load Demo Data')}
                </button>
                <p className="text-xs text-slate-600 text-center mt-2">
                  {language === 'ru' 
                    ? 'Создаст тестовых моряков, компании и вакансии' 
                    : 'Creates test sailors, companies and vacancies'}
                </p>
              </div>
            )}
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800/50 rounded-md">
            <p className="text-xs text-slate-500 text-center">
              {language === 'ru' ? 'Демо-доступ:' : 'Demo access:'} <br />
                <span className="font-mono text-slate-400">admin@crewcrm.com / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

