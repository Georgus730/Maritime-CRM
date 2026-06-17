import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Star,
  Phone,
  Mail,
  Trash2,
  Eye
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getSailors, deleteSailor, createSailor } from '../utils/api';
import { cn, formatDate, getStatusColor } from '../utils/helpers';
import { toast } from 'sonner';

const statusOptions = [
  { value: '', labelRu: 'Все статусы', labelEn: 'All statuses' },
  { value: 'available', labelRu: 'Доступны', labelEn: 'Available' },
  { value: 'on_voyage', labelRu: 'В рейсе', labelEn: 'On Voyage' },
  { value: 'not_available', labelRu: 'Недоступны', labelEn: 'Not Available' },
];

export default function SailorsPage() {
  const { t, language } = useLanguage();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [sailors, setSailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadSailors();
    }
  }, [statusFilter, isAuthenticated, authLoading]);

  const loadSailors = async () => {
    if (!isAuthenticated || authLoading || loading) return;
    
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const response = await getSailors(params);
      setSailors(response.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // rest unchanged
  const handleSearch = (e) => {
    e.preventDefault();
    loadSailors();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteSailor(id);
      setSailors(sailors.filter(s => s.id !== id));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={i < rating ? "text-amber-400 fill-amber-400" : "text-slate-700"} 
          />
        ))}
      </div>
    );
  };

  if (loading || authLoading) {
    return <div className="p-8 text-center text-slate-500">{t('loading')}</div>;
  }

  return (
    <div className="animate-fade-in" data-testid="sailors-page">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('sailors')}</h1>
          <p className="text-slate-500 mt-1">
            {language === 'ru' ? `Всего ${sailors.length} моряков` : `Total ${sailors.length} sailors`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors"
          data-testid="add-sailor-btn"
        >
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск по имени, email, телефону...' : 'Search by name, email, phone...'}
              className="w-full pl-10 pr-4 py-3 bg-maritime-card border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary"
              data-testid="search-input"
            />
          </div>
        </form>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-500" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-3 bg-maritime-card border border-slate-800 rounded-md text-slate-100 focus:border-primary"
            data-testid="status-filter"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {language === 'ru' ? opt.labelRu : opt.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-maritime-card border border-slate-800 rounded-md overflow-hidden">
        {sailors.length === 0 ? (
          <div className="p-8 text-center text-slate-500">{t('noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                  <th className="px-4 py-3 text-left">{t('fullName')}</th>
                  <th className="px-4 py-3 text-left">{t('position')}</th>
                  <th className="px-4 py-3 text-left">{t('status')}</th>
                  <th className="px-4 py-3 text-left">{t('rating')}</th>
                  <th className="px-4 py-3 text-left">{language === 'ru' ? 'Контакты' : 'Contacts'}</th>
                  <th className="px-4 py-3 text-left">{t('nationality')}</th>
                  <th className="px-4 py-3 text-right">{language === 'ru' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {sailors.map((sailor) => (
                  <tr 
                    key={sailor.id}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    data-testid={`sailor-row-${sailor.id}`}
                  >
                    <td className="px-4 py-3">
                      <Link 
                        to={`/sailors/${sailor.id}`}
                        className="font-medium text-slate-200 hover:text-primary transition-colors"
                      >
                        {sailor.full_name}
                      </Link>
                      {sailor.full_name_en && (
                        <p className="text-xs text-slate-500">{sailor.full_name_en}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{sailor.position}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-mono rounded-sm",
                        getStatusColor(sailor.status)
                      )}>
                        {t(sailor.status === 'available' ? 'available' : sailor.status === 'on_voyage' ? 'onVoyage' : 'notAvailable')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {renderStars(sailor.rating || 3)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-slate-400">
                        <a href={`tel:${sailor.phone}`} className="hover:text-primary transition-colors">
                          <Phone size={14} />
                        </a>
                        <a href={`mailto:${sailor.email}`} className="hover:text-primary transition-colors">
                          <Mail size={14} />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{sailor.nationality}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/sailors/${sailor.id}`}
                          className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-primary"
                          data-testid={`view-sailor-${sailor.id}`}
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(sailor.id)}
                          className="p-2 hover:bg-red-950/30 rounded-md transition-colors text-slate-400 hover:text-red-400"
                          data-testid={`delete-sailor-${sailor.id}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal - unchanged */}
    </div>
  );
}

// AddSailorModal component unchanged...

