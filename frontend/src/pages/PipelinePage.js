import React, { useState, useEffect } from 'react';
import { 
  Phone,
  Video,
  FileCheck,
  Plane,
  Ship,
  CheckCircle,
  ChevronRight,
  User,
  Briefcase,
  ExternalLink,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getPipeline, getVacancies, getSailors, updatePipeline, removeFromPipeline } from '../utils/api';
import { cn } from '../utils/helpers';
import { toast } from 'sonner';

const stages = [
  { id: 'contact', icon: Phone, labelRu: 'Контакт', labelEn: 'Contact', color: 'bg-slate-700' },
  { id: 'interview', icon: Video, labelRu: 'Собеседование', labelEn: 'Interview', color: 'bg-blue-900/50' },
  { id: 'offer', icon: FileCheck, labelRu: 'Оффер', labelEn: 'Offer', color: 'bg-amber-900/50' },
  { id: 'documents', icon: Plane, labelRu: 'Документы', labelEn: 'Documents', color: 'bg-violet-900/50' },
  { id: 'joined', icon: Ship, labelRu: 'На борту', labelEn: 'Joined', color: 'bg-sky-900/50' },
  { id: 'completed', icon: CheckCircle, labelRu: 'Завершен', labelEn: 'Completed', color: 'bg-emerald-900/50' },
];

export default function PipelinePage() {
  const { t, language } = useLanguage();
  const [pipeline, setPipeline] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [sailors, setSailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedVacancy]);

  const loadData = async () => {
    try {
      const params = selectedVacancy ? { vacancy_id: selectedVacancy } : {};
      const [pipelineRes, vacanciesRes, sailorsRes] = await Promise.all([
        getPipeline(params),
        getVacancies(),
        getSailors()
      ]);
      setPipeline(pipelineRes.data);
      setVacancies(vacanciesRes.data);
      setSailors(sailorsRes.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const getSailorName = (sailorId) => {
    const sailor = sailors.find(s => s.id === sailorId);
    return sailor?.full_name || '-';
  };

  const getSailorPosition = (sailorId) => {
    const sailor = sailors.find(s => s.id === sailorId);
    return sailor?.position || '-';
  };

  const getVacancyInfo = (vacancyId) => {
    const vacancy = vacancies.find(v => v.id === vacancyId);
    return vacancy ? `${vacancy.position} - ${vacancy.vessel_name}` : '-';
  };

  const handleMoveCard = async (cardId, newStage) => {
    try {
      await updatePipeline(cardId, { stage: newStage });
      setPipeline(pipeline.map(p => 
        p.id === cardId ? { ...p, stage: newStage } : p
      ));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleRemoveCard = async (cardId) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await removeFromPipeline(cardId);
      setPipeline(pipeline.filter(p => p.id !== cardId));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const getCardsByStage = (stageId) => {
    return pipeline.filter(p => p.stage === stageId);
  };

  return (
    <div className="animate-fade-in h-full flex flex-col" data-testid="pipeline-page">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('pipeline')}</h1>
          <p className="text-slate-500 mt-1">
            {language === 'ru' ? 'Воронка трудоустройства' : 'Hiring Pipeline'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedVacancy}
            onChange={(e) => setSelectedVacancy(e.target.value)}
            className="px-4 py-2 bg-maritime-card border border-slate-800 rounded-md text-slate-100 focus:border-primary"
            data-testid="vacancy-filter"
          >
            <option value="">{language === 'ru' ? 'Все вакансии' : 'All Vacancies'}</option>
            {vacancies.map(v => (
              <option key={v.id} value={v.id}>{v.position} - {v.vessel_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 grid grid-cols-6 gap-4">
          {stages.map((_, i) => (
            <div key={i} className="h-96 bg-maritime-card border border-slate-800 rounded-md skeleton" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max h-full pb-4">
            {stages.map((stage) => {
              const cards = getCardsByStage(stage.id);
              const stageIndex = stages.findIndex(s => s.id === stage.id);
              
              return (
                <div 
                  key={stage.id}
                  className="w-72 flex-shrink-0 flex flex-col"
                >
                  <div className={cn(
                    "p-3 rounded-t-md border border-slate-800 border-b-0 flex items-center justify-between",
                    stage.color
                  )}>
                    <div className="flex items-center gap-2">
                      <stage.icon size={18} className="text-slate-300" />
                      <span className="font-heading font-semibold text-white">
                        {language === 'ru' ? stage.labelRu : stage.labelEn}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono bg-slate-900/50 text-slate-400 rounded">
                      {cards.length}
                    </span>
                  </div>

                  <div className="flex-1 bg-maritime-card/30 border border-slate-800 rounded-b-md p-3 space-y-3 min-h-[400px] kanban-column">
                    {cards.map((card) => (
                      <div 
                        key={card.id}
                        className="bg-maritime-card border border-slate-800 rounded-md p-4 hover:border-primary/30 transition-colors kanban-card group"
                        data-testid={`pipeline-card-${card.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="text-slate-500" size={14} />
                              <span className="font-medium text-slate-200">
                                {getSailorName(card.sailor_id)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {getSailorPosition(card.sailor_id)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveCard(card.id)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-950/30 rounded transition-all text-slate-500 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                          <Briefcase size={12} />
                          <span className="truncate">{getVacancyInfo(card.vacancy_id)}</span>
                        </div>

                        {card.interview_link && (
                          <a 
                            href={card.interview_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline mb-3"
                          >
                            <Video size={12} />
                            {language === 'ru' ? 'Ссылка на звонок' : 'Meeting Link'}
                            <ExternalLink size={10} />
                          </a>
                        )}

                        {card.notes && (
                          <p className="text-xs text-slate-500 italic mb-3">
                            "{card.notes}"
                          </p>
                        )}

                        <div className="flex gap-1">
                          {stageIndex > 0 && (
                            <button
                              onClick={() => handleMoveCard(card.id, stages[stageIndex - 1].id)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded text-xs transition-colors"
                              data-testid={`move-back-${card.id}`}
                            >
                              <ChevronRight size={12} className="rotate-180" />
                            </button>
                          )}
                          {stageIndex < stages.length - 1 && (
                            <button
                              onClick={() => handleMoveCard(card.id, stages[stageIndex + 1].id)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded text-xs transition-colors"
                              data-testid={`move-forward-${card.id}`}
                            >
                              <ChevronRight size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingCard(card)}
                            className="px-2 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded text-xs transition-colors"
                          >
                            {language === 'ru' ? 'Изм.' : 'Edit'}
                          </button>
                        </div>
                      </div>
                    ))}

                    {cards.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
                        {language === 'ru' ? 'Пусто' : 'Empty'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSuccess={() => {
            setEditingCard(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

const EditCardModal = ({ card, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    interview_link: card.interview_link || '',
    notes: card.notes || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePipeline(card.id, formData);
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
        className="bg-maritime-card border border-slate-800 rounded-md w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-white">
            {language === 'ru' ? 'Редактировать карточку' : 'Edit Card'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? 'Ссылка на видеозвонок' : 'Video Call Link'}
            </label>
            <input
              type="url"
              value={formData.interview_link}
              onChange={(e) => setFormData({...formData, interview_link: e.target.value})}
              placeholder="https://meet.google.com/..."
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
            />
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
            >
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

