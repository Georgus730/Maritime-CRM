import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Building2,
  MapPin,
  Flag,
  Ship,
  Users,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../utils/api';
import { cn, getVesselTypeLabel } from '../utils/helpers';
import { toast } from 'sonner';

export default function CompaniesPage() {
  const { t, language } = useLanguage();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const params = search ? { search } : {};
      const response = await getCompanies(params);
      setCompanies(response.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCompanies();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteCompany(id);
      setCompanies(companies.filter(c => c.id !== id));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  return (
    <div className="animate-fade-in" data-testid="companies-page">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('companies')}</h1>
          <p className="text-slate-500 mt-1">
            {language === 'ru' ? `Всего ${companies.length} компаний` : `Total ${companies.length} companies`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors"
          data-testid="add-company-btn"
        >
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'ru' ? 'Поиск по названию...' : 'Search by name...'}
            className="w-full pl-10 pr-4 py-3 bg-maritime-card border border-slate-800 rounded-md text-slate-100 placeholder:text-slate-600 focus:border-primary"
            data-testid="company-search-input"
          />
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-maritime-card border border-slate-800 rounded-md skeleton" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t('noData')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div 
              key={company.id}
              className="bg-maritime-card border border-slate-800 rounded-md p-5 hover:border-primary/30 transition-colors group"
              data-testid={`company-card-${company.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Building2 className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-white">{company.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Flag size={12} />
                      <span>{company.flag}</span>
                      <MapPin size={12} className="ml-2" />
                      <span>{company.country}</span>
                    </div>
                  </div>
                </div>
              </div>

              {company.vessel_types && company.vessel_types.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Ship size={12} />
                    <span>{language === 'ru' ? 'Типы судов' : 'Vessel types'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {company.vessel_types.map((type, i) => (
                      <span 
                        key={i}
                        className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded-sm"
                      >
                        {getVesselTypeLabel(type, language)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {company.contacts && company.contacts.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <Users size={14} />
                  <span>{company.contacts.length} {language === 'ru' ? 'контактов' : 'contacts'}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setEditingCompany(company)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-sm transition-colors"
                  data-testid={`edit-company-${company.id}`}
                >
                  <Edit size={14} />
                  {t('edit')}
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-md text-sm transition-colors"
                  data-testid={`delete-company-${company.id}`}
                >
                  <Trash2 size={14} />
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showAddModal || editingCompany) && (
        <CompanyModal
          company={editingCompany}
          onClose={() => { setShowAddModal(false); setEditingCompany(null); }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingCompany(null);
            loadCompanies();
          }}
        />
      )}
    </div>
  );
}

const CompanyModal = ({ company, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    flag: company?.flag || '',
    country: company?.country || '',
    vessel_types: company?.vessel_types || [],
    notes: company?.notes || ''
  });

  const vesselTypes = ['tanker', 'bulk_carrier', 'container', 'passenger', 'general_cargo'];

  const toggleVesselType = (type) => {
    setFormData(prev => ({
      ...prev,
      vessel_types: prev.vessel_types.includes(type)
        ? prev.vessel_types.filter(t => t !== type)
        : [...prev.vessel_types, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (company) {
        await updateCompany(company.id, formData);
      } else {
        await createCompany(formData);
      }
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
        className="bg-maritime-card border border-slate-800 rounded-md w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-semibold text-white">
            {company 
              ? (language === 'ru' ? 'Редактировать компанию' : 'Edit Company')
              : (language === 'ru' ? 'Добавить компанию' : 'Add Company')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? 'Название' : 'Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
              data-testid="company-name-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('flag')} *</label>
              <input
                type="text"
                value={formData.flag}
                onChange={(e) => setFormData({...formData, flag: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('country')} *</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? 'Типы судов' : 'Vessel Types'}
            </label>
            <div className="flex flex-wrap gap-2">
              {vesselTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleVesselType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    formData.vessel_types.includes(type)
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  )}
                >
                  {getVesselTypeLabel(type, language)}
                </button>
              ))}
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
              data-testid="save-company-btn"
            >
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

