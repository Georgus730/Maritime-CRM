import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText,
  Ship,
  User,
  Trash2,
  Edit,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getContracts, getSailors, getVacancies, createContract, updateContract, deleteContract } from '../utils/api';
import { cn, formatDate, getStatusColor } from '../utils/helpers';
import { toast } from 'sonner';

const statusOptions = [
  { value: 'preparation', labelRu: 'Подготовка', labelEn: 'Preparation' },
  { value: 'flight', labelRu: 'Перелет', labelEn: 'In Transit' },
  { value: 'on_board', labelRu: 'На борту', labelEn: 'On Board' },
  { value: 'completed', labelRu: 'Завершен', labelEn: 'Completed' },
];

export default function ContractsPage() {
  const { t, language } = useLanguage();
  const [contracts, setContracts] = useState([]);
  const [sailors, setSailors] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contractsRes, sailorsRes, vacanciesRes] = await Promise.all([
        getContracts(),
        getSailors(),
        getVacancies()
      ]);
      setContracts(contractsRes.data);
      setSailors(sailorsRes.data);
      setVacancies(vacanciesRes.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteContract(id);
      setContracts(contracts.filter(c => c.id !== id));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const getSailorName = (sailorId) => {
    const sailor = sailors.find(s => s.id === sailorId);
    return sailor?.full_name || '-';
  };

  const getVacancyInfo = (vacancyId) => {
    const vacancy = vacancies.find(v => v.id === vacancyId);
    return vacancy ? { position: vacancy.position, vessel: vacancy.vessel_name } : { position: '-', vessel: '-' };
  };

  return (
    <div className="animate-fade-in" data-testid="contracts-page">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('contracts')}</h1>
          <p className="text-slate-500 mt-1">
            {language === 'ru' ? `Всего ${contracts.length} контрактов` : `Total ${contracts.length} contracts`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors"
          data-testid="add-contract-btn"
        >
          <Plus size={18} />
          {t('add')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-maritime-card border border-slate-800 rounded-md skeleton" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t('noData')}</div>
      ) : (
        <div className="bg-maritime-card border border-slate-800 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                  <th className="px-4 py-3 text-left">{language === 'ru' ? 'Моряк' : 'Sailor'}</th>
                  <th className="px-4 py-3 text-left">{language === 'ru' ? 'Должность / Судно' : 'Position / Vessel'}</th>
                  <th className="px-4 py-3 text-left">{t('status')}</th>
                  <th className="px-4 py-3 text-left">{language === 'ru' ? 'Период' : 'Period'}</th>
                  <th className="px-4 py-3 text-left">{t('salary')}</th>
                  <th className="px-4 py-3 text-right">{language === 'ru' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const vacancyInfo = getVacancyInfo(contract.vacancy_id);
                  return (
                    <tr 
                      key={contract.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      data-testid={`contract-row-${contract.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="text-slate-500" size={16} />
                          <span className="text-slate-200">{getSailorName(contract.sailor_id)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-slate-200">{vacancyInfo.position}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Ship size={12} />
                            {vacancyInfo.vessel}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-mono rounded-sm",
                          getStatusColor(contract.status)
                        )}>
                          {statusOptions.find(s => s.value === contract.status)?.[language === 'ru' ? 'labelRu' : 'labelEn'] || contract.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm text-slate-400">
                          {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-400 font-mono">
                          {contract.salary} {contract.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingContract(contract)}
                            className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-primary"
                            data-testid={`edit-contract-${contract.id}`}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(contract.id)}
                            className="p-2 hover:bg-red-950/30 rounded-md transition-colors text-slate-400 hover:text-red-400"
                            data-testid={`delete-contract-${contract.id}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showAddModal || editingContract) && (
        <ContractModal
          contract={editingContract}
          sailors={sailors}
          vacancies={vacancies}
          onClose={() => { setShowAddModal(false); setEditingContract(null); }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingContract(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

const ContractModal = ({ contract, sailors, vacancies, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sailor_id: contract?.sailor_id || (sailors[0]?.id || ''),
    vacancy_id: contract?.vacancy_id || (vacancies[0]?.id || ''),
    sign_date: contract?.sign_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    start_date: contract?.start_date?.split('T')[0] || '',
    end_date: contract?.end_date?.split('T')[0] || '',
    status: contract?.status || 'preparation',
    salary: contract?.salary || '',
    currency: contract?.currency || 'USD',
    notes: contract?.notes || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        ...formData,
        sign_date: new Date(formData.sign_date).toISOString(),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        salary: parseInt(formData.salary)
      };
      if (contract) {
        await updateContract(contract.id, data);
      } else {
        await createContract(data);
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
            {contract 
              ? (language === 'ru' ? 'Редактировать контракт' : 'Edit Contract')
              : (language === 'ru' ? 'Добавить контракт' : 'Add Contract')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? 'Моряк' : 'Sailor'} *
            </label>
            <select
              value={formData.sailor_id}
              onChange={(e) => setFormData({...formData, sailor_id: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
            >
              {sailors.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} - {s.position}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? 'Вакансия' : 'Vacancy'} *
            </label>
            <select
              value={formData.vacancy_id}
              onChange={(e) => setFormData({...formData, vacancy_id: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
            >
              {vacancies.map(v => (
                <option key={v.id} value={v.id}>{v.position} - {v.vessel_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('startDate')} *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('endDate')} *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('salary')} *</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({...formData, salary: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {language === 'ru' ? opt.labelRu : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
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
              data-testid="save-contract-btn"
            >
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

