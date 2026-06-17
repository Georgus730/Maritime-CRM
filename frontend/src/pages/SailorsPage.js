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
  const [searchParams, setSearchParams] = useSearchParams();
  const [sailors, setSailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSailors();
  }, [statusFilter]);

  const loadSailors = async () => {
    try {
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

  return (
    <div className="animate-fade-in" data-testid="sailors-page">
      {/* Header */}
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

      {/* Filters */}
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

      {/* Table */}
      <div className="bg-maritime-card border border-slate-800 rounded-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{t('loading')}</div>
        ) : sailors.length === 0 ? (
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

      {/* Add Modal */}
      {showAddModal && (
        <AddSailorModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            loadSailors();
          }}
        />
      )}
    </div>
  );
}

const AddSailorModal = ({ onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    full_name_en: '',
    birth_date: '',
    nationality: 'Russia',
    phone: '',
    email: '',
    whatsapp: '',
    telegram: '',
    position: '',
    status: 'available',
    rating: 3,
    english_level: 'Basic',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        birth_date: new Date(formData.birth_date).toISOString(),
        documents: [],
        experience: []
      };
      await createSailor(data);
      toast.success(t('success'));
      onSuccess();
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
      <div 
        className="bg-maritime-card border border-slate-800 rounded-md w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-heading text-2xl font-semibold text-white">
            {language === 'ru' ? 'Добавить моряка' : 'Add Sailor'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('fullName')} *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
                data-testid="sailor-name-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('fullName')} (EN)</label>
              <input
                type="text"
                value={formData.full_name_en}
                onChange={(e) => setFormData({...formData, full_name_en: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('position')} *</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('birthDate')} *</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('email')} *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('phone')} *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('nationality')}</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('englishLevel')}</label>
              <select
                value={formData.english_level}
                onChange={(e) => setFormData({...formData, english_level: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              >
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Good">Good</option>
                <option value="Fluent">Fluent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              >
                <option value="available">{t('available')}</option>
                <option value="on_voyage">{t('onVoyage')}</option>
                <option value="not_available">{t('notAvailable')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('rating')}</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              >
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n} {"★".repeat(n)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors disabled:opacity-50"
              data-testid="save-sailor-btn"
            >
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

