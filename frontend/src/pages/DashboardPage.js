import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Briefcase, FileText, Building2,
  AlertTriangle, Calendar, UserPlus, Bell,
  ArrowRight, Ship
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardSummary, sendExpiryNotifications } from '../utils/api';
import { formatDate, cn } from '../utils/helpers';
import { toast } from 'sonner';

const StatCard = React.memo(({ icon: Icon, label, value, color, link }) => (
  <Link
    to={link}
    className="bg-maritime-card border border-slate-800 rounded-md p-5 hover:border-primary/30 transition-colors group"
    data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm mb-1">{label}</p>
        <p className={cn("font-heading text-3xl font-bold", color)}>{value}</p>
      </div>
      <div className="p-3 rounded-md bg-slate-800/50">
        <Icon className={color} size={24} />
      </div>
    </div>
    <div className="mt-3 flex items-center text-xs text-slate-500 group-hover:text-primary transition-colors">
      <span>Details</span>
      <ArrowRight size={14} className="ml-1" />
    </div>
  </Link>
));

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [stats, setStats] = useState(null);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [recentSailors, setRecentSailors] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [sendingNotifications, setSendingNotifications] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setDataLoading(true);
      const response = await getDashboardSummary();
      const data = response.data;
      setStats(data.stats);
      setExpiringDocs(data.expiring_documents || []);
      setRotations(data.upcoming_rotations || []);
      setRecentSailors(data.recent_sailors || []);
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error(language === 'ru' ? '\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445' : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadDashboardData();
    }
  }, [isAuthenticated, authLoading, loadDashboardData]);

  const handleSendNotifications = async () => {
    if (sendingNotifications || expiringDocs.length === 0) return;
    setSendingNotifications(true);
    try {
      await sendExpiryNotifications();
      toast.success(language === 'ru' ? '\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B' : 'Notifications sent');
    } catch (error) {
      toast.error(language === 'ru' ? '\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438' : 'Failed to send');
    } finally {
      setSendingNotifications(false);
    }
  };

  if (dataLoading || authLoading) {
    return (
      <div className="animate-fade-in" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-maritime-card border border-slate-800 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="dashboard-page">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-white">{t('dashboard')}</h1>
        <p className="text-slate-500 mt-1">
          {language === 'ru' ? '\u041E\u0431\u0437\u043E\u0440 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u044D\u043A\u0438\u043F\u0430\u0436\u0430\u043C\u0438' : 'Crew management system overview'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard icon={Users} label={t('totalSailors')} value={stats?.total_sailors || 0} color="text-primary" link="/sailors" />
        <StatCard icon={UserPlus} label={t('availableSailors')} value={stats?.available_sailors || 0} color="text-emerald-400" link="/sailors?status=available" />
        <StatCard icon={Briefcase} label={t('openVacancies')} value={stats?.open_vacancies || 0} color="text-amber-400" link="/vacancies" />
        <StatCard icon={FileText} label={t('activeContracts')} value={stats?.active_contracts || 0} color="text-sky-400" link="/contracts" />
        <StatCard icon={Building2} label={t('totalCompanies')} value={stats?.total_companies || 0} color="text-violet-400" link="/companies" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring documents table */}
        <div className="lg:col-span-2 bg-maritime-card border border-slate-800 rounded-md overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={20} />
              <h2 className="font-heading text-lg font-semibold text-white">{t('expiringDocuments')}</h2>
              {expiringDocs.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-mono bg-red-950/30 text-red-400 rounded-sm border border-red-900/50">
                  {expiringDocs.length}
                </span>
              )}
            </div>
            <button
              onClick={handleSendNotifications}
              disabled={sendingNotifications || expiringDocs.length === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
              data-testid="send-notifications-btn"
            >
              <Bell size={14} />
              {t('sendNotifications')}
            </button>
          </div>
          <div className="overflow-x-auto">
            {expiringDocs.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {language === 'ru' ? '\u041D\u0435\u0442 \u0438\u0441\u0442\u0435\u043A\u0430\u044E\u0449\u0438\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432' : 'No expiring documents'}
              </div>
            ) : (
              <table className="w-full" data-testid="expiring-docs-table">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <th className="px-4 py-3 text-left">{t('fullName')}</th>
                    <th className="px-4 py-3 text-left">{language === 'ru' ? '\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442' : 'Document'}</th>
                    <th className="px-4 py-3 text-left">{language === 'ru' ? '\u0418\u0441\u0442\u0435\u043A\u0430\u0435\u0442' : 'Expires'}</th>
                    <th className="px-4 py-3 text-left">{t('daysLeft')}</th>
                  </tr>
                </thead>
                <tbody>
                  {expiringDocs.slice(0, 6).map((doc, index) => (
                    <tr
                      key={`${doc.sailor_id}-${doc.document_type}-${index}`}
                      className={cn(
                        "border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors",
                        doc.days_remaining <= 30 && "doc-expiring",
                        doc.days_remaining > 30 && doc.days_remaining <= 60 && "doc-warning"
                      )}
                      data-testid={`expiring-doc-row-${index}`}
                    >
                      <td className="px-4 py-3">
                        <Link to={`/sailors/${doc.sailor_id}`} className="text-slate-200 hover:text-primary transition-colors">
                          {doc.sailor_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-400">{doc.document_type}</td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-400">{formatDate(doc.expiry_date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-mono rounded-sm",
                          doc.days_remaining <= 30
                            ? "bg-red-950/30 text-red-400 border border-red-900/50 animate-pulse"
                            : "bg-amber-950/30 text-amber-400 border border-amber-900/50"
                        )}>
                          {doc.days_remaining} {language === 'ru' ? '\u0434\u043D.' : 'days'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent sailors */}
        <div className="bg-maritime-card border border-slate-800 rounded-md overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <UserPlus className="text-primary" size={20} />
              <h2 className="font-heading text-lg font-semibold text-white">{t('recentSailors')}</h2>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {recentSailors.length === 0 ? (
              <div className="text-center text-slate-500 py-4">{t('noData')}</div>
            ) : (
              recentSailors.map((sailor) => (
                <Link
                  key={sailor.id}
                  to={`/sailors/${sailor.id}`}
                  className="block p-3 bg-slate-900/50 border border-slate-800/50 rounded-md hover:border-primary/30 transition-colors"
                  data-testid={`recent-sailor-${sailor.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">{sailor.full_name}</p>
                      <p className="text-sm text-slate-500">{sailor.position}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-mono rounded-sm",
                      sailor.status === 'available' && "status-available",
                      sailor.status === 'on_voyage' && "status-on-voyage",
                      sailor.status === 'not_available' && "status-not-available"
                    )}>
                      {t(sailor.status === 'available' ? 'available' : sailor.status === 'on_voyage' ? 'onVoyage' : 'notAvailable')}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-800">
            <Link to="/sailors" className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors" data-testid="view-all-sailors">
              {language === 'ru' ? '\u0412\u0441\u0435 \u043C\u043E\u0440\u044F\u043A\u0438' : 'All sailors'}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming rotations */}
      {rotations.length > 0 && (
        <div className="mt-6 bg-maritime-card border border-slate-800 rounded-md overflow-hidden" data-testid="rotations-section">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="text-sky-400" size={20} />
              <h2 className="font-heading text-lg font-semibold text-white">{t('upcomingRotations')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {rotations.map((rotation) => (
              <div key={rotation.contract_id} className="p-4 bg-slate-900/50 border border-slate-800/50 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="text-sky-400" size={16} />
                  <span className="font-mono text-sm text-slate-400">{rotation.vessel_name}</span>
                </div>
                <p className="font-medium text-slate-200">{rotation.sailor_name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {language === 'ru' ? '\u041E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u0435:' : 'Ends:'} {formatDate(rotation.end_date)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
