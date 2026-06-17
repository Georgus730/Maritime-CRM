import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter,
  Briefcase,
  Ship,
  Building2,
  Calendar,
  DollarSign,
  Trash2,
  Edit,
  X,
  Search as SearchIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getVacancies, getCompanies, createVacancy, updateVacancy, deleteVacancy } from '../utils/api';
import { cn, formatDate, getStatusColor, getVesselTypeLabel } from '../utils/helpers';
import { toast } from 'sonner';

const statusOptions = [
  { value: '', labelRu: 'Все статусы', labelEn: 'All statuses' },
  { value: 'open', labelRu: 'Открытые', labelEn: 'Open' },
  { value: 'in_progress', labelRu: 'В работе', labelEn: 'In Progress' },
  { value: 'closed', labelRu: 'Закрытые', labelEn: 'Closed' },
  { value: 'at_sea', labelRu: 'Судно в море', labelEn: 'At Sea' },
];

export default function VacanciesPage() {
  const { t, language } = useLanguage();
  const [vacancies, setVacancies] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (editingVacancy) {
      setFormData({
        company_id: editingVacancy.company_id || companies[0]?.id || '',
        position: editingVacancy.position || '',
        vessel_name: editingVacancy.vessel_name || '',
        vessel_type: editingVacancy.vessel_type || 'container',
        requirements: editingVacancy.requirements ? editingVacancy.requirements.join(', ') : '',
        min_experience_months: editingVacancy.min_experience_months || 0,
        english_required: editingVacancy.english_required || false,
        salary_min: editingVacancy.salary_min || '',
        salary_max: editingVacancy.salary_max || '',
        currency: editingVacancy.currency || 'USD',
        start_date: editingVacancy.start_date ? editingVacancy.start_date.split('T')[0] : '',
        contract_duration_months: editingVacancy.contract_duration_months || 4,
        status: editingVacancy.status || 'open',
        notes: editingVacancy.notes || ''
      });
    } else {
      setFormData({
        company_id: companies[0]?.id || '',
        position: '',
        vessel_name: '',
        vessel_type: 'container',
        requirements: '',
        min_experience_months: 0,
        english_required: false,
        salary_min: '',
        salary_max: '',
        currency: 'USD',
        start_date: '',
        contract_duration_months: 4,
        status: 'open',
        notes: ''
      });
    }
  }, [editingVacancy, companies]);

  const loadData = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [vacanciesRes, companiesRes] = await Promise.all([
        getVacancies(params),
        getCompanies()
      ]);
      setVacancies(vacanciesRes.data);
      setCompanies(companiesRes.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const data = {
        ...formData,
        requirements: formData.requirements.split(',').map(r => r.trim()).filter(Boolean),
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null
      };
      if (editingVacancy) {
        await updateVacancy(editingVacancy.id, data);
      } else {
        await createVacancy(data);
      }
      toast.success(t('success'));
      setShowForm(false);
      setEditingVacancy(null);
      loadData();
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteVacancy(id);
      setVacancies(vacancies.filter(v => v.id !== id));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || '-';
  };

  return (
    <div className="animate-fade-in" data-testid="vacancies-page">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('vacancies')}</h1>
          <p className="text-slate-500 mt-1">
            {language === 'ru' ? `Всего ${vacancies.length} вакансий` : `Total ${vacancies.length} vacancies`}
          </p>
        </div>
        <button
          onClick={() => { setEditingVacancy(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors"
          data-testid="add-vacancy-btn"
        >
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Filter className="text-slate-500" size={18} />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-maritime-card border border-slate-800 rounded-md text-slate-100 focus:border-primary"
          data-testid="vacancy-status-filter"
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {language === 'ru' ? opt.labelRu : opt.labelEn}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-maritime-card border border-slate-800 rounded-md skeleton" />
          ))}
        </div>
      ) : vacancies.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t('noData')}</div>
      ) : (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <div 
              key={vacancy.id}
              className="bg-maritime-card border border-slate-800 rounded-md p-5 hover:border-primary/30 transition-colors"
              data-testid={`vacancy-card-${vacancy.id}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="text-primary" size={20} />
                    <h3 className="font-heading text-xl font-semibold text-white">{vacancy.position}</h3>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-mono rounded-sm",
                      getStatusColor(vacancy.status)
                    )}>
                      {t(vacancy.status === 'open' ? 'open' : vacancy.status === 'in_progress' ? 'inProgress' : vacancy.status === 'closed' ? 'closed' : 'atSea')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 size={14} />
                      <span>{getCompanyName(vacancy.company_id)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Ship size={14} />
                      <span>{vacancy.vessel_name}</span>
                      <span className="px-1.5 py-0.5 text-xs bg-slate-800 rounded">
                        {getVesselTypeLabel(vacancy.vessel_type, language)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar size={14} />
                      <span>{vacancy.start_date ? formatDate(vacancy.start_date) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <DollarSign size={14} />
                      <span>
                        {vacancy.salary_min && vacancy.salary_max 
                          ? `${vacancy.salary_min} - ${vacancy.salary_max} ${vacancy.currency}`
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {vacancy.requirements && vacancy.requirements.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {vacancy.requirements.map((req, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-slate-800/50 text-slate-400 rounded">
                          {req}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast.info(language === 'ru' ? 'Поиск кандидатов скоро' : 'Candidates search coming soon')}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 rounded-md text-sm transition-colors"
                    data-testid={`find-candidates-${vacancy.id}`}
                  >
                    <SearchIcon size={16} />
                    {t('findCandidates')}
                  </button>
                  <button
                    onClick={() => { setEditingVacancy(vacancy); setShowForm(true); }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                    data-testid={`edit-vacancy-${vacancy.id}`}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(vacancy.id)}
                    className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-md transition-colors"
                    data-testid={`delete-vacancy-${vacancy.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div 
            className="bg-maritime-card border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 p-6 border-b border-slate-800 bg-maritime-card z-10 flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold text-white">
                {editingVacancy 
                  ? (language === 'ru' ? 'Редактировать вакансию' : 'Edit Vacancy') 
                  : (language === 'ru' ? 'Добавить вакансию' : 'Add Vacancy')}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('company')}</label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('position')} *</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('vesselName')} *</label>
                  <input
                    type="text"
                    value={formData.vessel_name}
                    onChange={(e) => setFormData({...formData, vessel_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('vesselType')}</label>
                  <select
                    value={formData.vessel_type}
                    onChange={(e) => setFormData({...formData, vessel_type: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="tanker">{getVesselTypeLabel('tanker', language)}</option>
                    <option value="bulk_carrier">{getVesselTypeLabel('bulk_carrier', language)}</option>
                    <option value="container">{getVesselTypeLabel('container', language)}</option>
                    <option value="passenger">{getVesselTypeLabel('passenger', language)}</option>
                    <option value="general_cargo">{getVesselTypeLabel('general_cargo', language)}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('startDate')}</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">{t('status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="open">{t('open')}</option>
                    <option value="in_progress">{t('inProgress')}</option>
                    <option value="closed">{t('closed')}</option>
                    <option value="at_sea">{t('atSea')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {language === 'ru' ? 'Зарплата от' : 'Salary Min'}
                  </label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({...formData, salary_min: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {language === 'ru' ? 'Зарплата до' : 'Salary Max'}
                  </label>
                  <input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({...formData, salary_max: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('requirements')} ({language === 'ru' ? 'через запятую' : 'comma separated'})
                  </label>
                  <input
                    type="text"
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="STCW, COC, 3+ years experience"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id="english_required"
                    checked={formData.english_required}
                    onChange={(e) => setFormData({...formData, english_required: e.target.checked})}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 focus:ring-primary"
                  />
                  <label htmlFor="english_required" className="text-sm text-slate-300">
                    {language === 'ru' ? 'Требуется английский' : 'English required'}
                  </label>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="save-vacancy-btn"
                >
                  {formLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      {t('saving')}
                    </>
                  ) : (
                    t('save')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
