import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Building2,
  AlertTriangle,
  Calendar,
  UserPlus,
  Bell,
  ArrowRight,
  Ship
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getDashboardStats, 
  getExpiringDocuments, 
  getUpcomingRotations, 
  getRecentSailors,
  sendExpiryNotifications 
} from '../utils/api';
import { formatDate, cn } from '../utils/helpers';
import { toast } from 'sonner';

const StatCard = ({ icon: Icon, label, value, color, link }) => (
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
      <div className={cn("p-3 rounded-md", `bg-${color}/10`)}>
        <Icon className={color} size={24} />
      </div>
    </div>
    <div className="mt-3 flex items-center text-xs text-slate-500 group-hover:text-primary transition-colors">
      <span>Подробнее</span>
      <ArrowRight size={14} className="ml-1" />
    </div>
  </Link>
);

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [rotations, setRotations] = useState([]);
  const [recentSailors, setRecentSailors] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [sendingNotifications, setSendingNotifications] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isAuthenticated && !authLoading && !dataLoading) {
      loadDashboardData();
    }
  }, [isAuthenticated, authLoading]);

  const loadDashboardData = async () => {
    if (!isAuthenticated || authLoading || dataLoading) {
      return;
    }

    try {
      setDataLoading(true);
      const [statsRes, expiringRes, rotationsRes, recentRes] = await Promise.all([
        getDashboardStats(),
        getExpiringDocuments(),
        getUpcomingRotations(),
        getRecentSailors(5)
      ]);
      setStats(statsRes.data);
      setExpiringDocs(expiringRes.data);
      setRotations(rotationsRes.data);
      setRecentSailors(recentRes.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSendNotifications = async () => {
    if (!isAuthenticated || authLoading || sendingNotifications || expiringDocs.length === 0) {
      return;
    }

    setSendingNotifications(true);
    try {
      await sendExpiryNotifications();
      toast.success(language === 'ru' ? 'Уведомления отправлены' : 'Notifications sent');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка отправки' : 'Failed to send');
    } finally {
      setSendingNotifications(false);
    }
  };

  if (dataLoading || authLoading) {
    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-maritime-card border border-slate-800 rounded-md skeleton" />
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
          {language === 'ru' ? 'Обзор системы управления экипажами' : 'Crew management system overview'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          icon={Users} 
          label={t('totalSailors')} 
          value={stats?.total_sailors || 0} 
          color="text-primary"
          link="/sailors"
        />
        <StatCard 
          icon={UserPlus} 
          label={t('availableSailors')} 
          value={stats?.available_sailors || 0} 
          color="text-emerald-400"
          link="/sailors?status=available"
        />
        <StatCard 
          icon={Briefcase} 
          label={t('openVacancies')} 
          value={stats?.open_vacancies || 0} 
          color="text-amber-400"
          link="/vacancies"
        />
        <StatCard 
          icon={FileText} 
          label={t('activeContracts')} 
          value={stats?.active_contracts || 0} 
          color="text-sky-400"
          link="/contracts"
        />
        <StatCard 
          icon={Building2} 
          label={t('totalCompanies')} 
          value={stats?.total_companies || 0} 
          color="text-violet-400"
          link="/companies"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                {language === 'ru' ? 'Нет истекающих документов' : 'No expiring documents'}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <th className="px-4 py-3 text-left">{t('fullName')}</th>
                    <th className="px-4 py-3 text-left">{language === 'ru' ? 'Документ' : 'Document'}</th>
                    <th className="px-4 py-3 text-left">{language === 'ru' ? 'Истекает' : 'Expires'}</th>
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
                    >
                      <td className="px-4 py-3">
                        <Link 
                          to={`/sailors/${doc.sailor_id}`}
                          className="text-slate-200 hover:text-primary transition-colors"
                        >
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
                          {doc.days_remaining} {language === 'ru' ? 'дн.' : 'days'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

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
            <Link
              to="/sailors"
              className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-primary transition-colors"
            >
              {language === 'ru' ? 'Все моряки' : 'All sailors'}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {rotations.length > 0 && (
        <div className="mt-6 bg-maritime-card border border-slate-800 rounded-md overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="text-sky-400" size={20} />
              <h2 className="font-heading text-lg font-semibold text-white">{t('upcomingRotations')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {rotations.map((rotation) => (
              <div 
                key={rotation.contract_id}
                className="p-4 bg-slate-900/50 border border-slate-800/50 rounded-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="text-sky-400" size={16} />
                  <span className="font-mono text-sm text-slate-400">{rotation.vessel_name}</span>
                </div>
                <p className="font-medium text-slate-200">{rotation.sailor_name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {language === 'ru' ? 'Окончание:' : 'Ends:'} {formatDate(rotation.end_date)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

