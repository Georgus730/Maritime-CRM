import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Mail, Lock, AlertCircle, Globe } from 'lucide-react';
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
  
  const { login } = useAuth();
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

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await seedDemoData();
      toast.success(language === 'ru' ? 'Демо-данные загружены!' : 'Demo data loaded!');
      setEmail(response.data.credentials.admin.email);
      setPassword(response.data.credentials.admin.password);
    } catch (err) {
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'Failed to load data');
    } finally {
      setSeeding(false);
    }
  };

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

          {/* Login form */}
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
            </form>

            {/* Demo data button */}
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
          </div>

          {/* Demo credentials hint */}
          <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800/50 rounded-md">
            <p className="text-xs text-slate-500 text-center">
              {language === 'ru' ? 'Демо-доступ:' : 'Demo access:'} <br />
                <span className="font-mono text-slate-400">admin@maritimecrm.com / admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

