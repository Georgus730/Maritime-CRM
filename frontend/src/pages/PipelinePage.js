import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Phone, Video, FileCheck, Plane, Ship, CheckCircle,
  User, Briefcase, ExternalLink, X, Plus, GripVertical
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLanguage } from '../contexts/LanguageContext';
import { getPipeline, getVacancies, getSailors, updatePipeline, removeFromPipeline, addToPipeline } from '../utils/api';
import { cn } from '../utils/helpers';
import { toast } from 'sonner';
import api from '../utils/api';

const stages = [
  { id: 'contact', icon: Phone, labelRu: '\u041A\u043E\u043D\u0442\u0430\u043A\u0442', labelEn: 'Contact', color: 'bg-slate-700' },
  { id: 'interview', icon: Video, labelRu: '\u0421\u043E\u0431\u0435\u0441\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435', labelEn: 'Interview', color: 'bg-blue-900/50' },
  { id: 'offer', icon: FileCheck, labelRu: '\u041E\u0444\u0444\u0435\u0440', labelEn: 'Offer', color: 'bg-amber-900/50' },
  { id: 'documents', icon: Plane, labelRu: '\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B', labelEn: 'Documents', color: 'bg-violet-900/50' },
  { id: 'joined', icon: Ship, labelRu: '\u041D\u0430 \u0431\u043E\u0440\u0442\u0443', labelEn: 'Joined', color: 'bg-sky-900/50' },
  { id: 'completed', icon: CheckCircle, labelRu: '\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D', labelEn: 'Completed', color: 'bg-emerald-900/50' },
];

// Sortable card component
const SortableCard = ({ card, getSailorName, getSailorPosition, getVacancyInfo, onRemove, onEdit, language }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card, stage: card.stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-maritime-card border border-slate-800 rounded-md p-4 hover:border-primary/30 transition-colors group",
        isDragging && "shadow-neon"
      )}
      data-testid={`pipeline-card-${card.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
            data-testid={`drag-handle-${card.id}`}
          >
            <GripVertical size={14} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <User className="text-slate-500 shrink-0" size={14} />
              <span className="font-medium text-slate-200 truncate">
                {getSailorName(card.sailor_id)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{getSailorPosition(card.sailor_id)}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(card.id)}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-950/30 rounded transition-all text-slate-500 hover:text-red-400 shrink-0"
          data-testid={`remove-card-${card.id}`}
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
          {language === 'ru' ? '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0437\u0432\u043E\u043D\u043E\u043A' : 'Meeting Link'}
          <ExternalLink size={10} />
        </a>
      )}

      {card.notes && (
        <p className="text-xs text-slate-500 italic mb-3">"{card.notes}"</p>
      )}

      <button
        onClick={() => onEdit(card)}
        className="w-full px-2 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded text-xs transition-colors"
        data-testid={`edit-card-${card.id}`}
      >
        {language === 'ru' ? '\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C' : 'Edit'}
      </button>
    </div>
  );
};

// Droppable column
const DroppableColumn = ({ stage, cards, children, language }) => {
  const cardIds = useMemo(() => cards.map(c => c.id), [cards]);

  return (
    <div className="w-72 flex-shrink-0 flex flex-col" data-testid={`column-${stage.id}`}>
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

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 bg-maritime-card/30 border border-slate-800 rounded-b-md p-3 space-y-3 min-h-[400px]"
             data-testid={`drop-zone-${stage.id}`}>
          {children}
          {cards.length === 0 && (
            <div className="flex items-center justify-center h-32 text-slate-600 text-sm border-2 border-dashed border-slate-800 rounded-md">
              {language === 'ru' ? '\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0441\u044E\u0434\u0430' : 'Drop here'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// Card overlay for drag
const CardOverlay = ({ card, getSailorName, getSailorPosition, getVacancyInfo }) => (
  <div className="bg-maritime-card border-2 border-primary rounded-md p-4 shadow-neon w-72 opacity-90">
    <div className="flex items-center gap-2 mb-2">
      <User className="text-primary" size={14} />
      <span className="font-medium text-slate-200">{getSailorName(card.sailor_id)}</span>
    </div>
    <div className="text-xs text-slate-500">{getSailorPosition(card.sailor_id)}</div>
    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
      <Briefcase size={12} />
      <span className="truncate">{getVacancyInfo(card.vacancy_id)}</span>
    </div>
  </div>
);

export default function PipelinePage() {
  const { t, language } = useLanguage();
  const [pipeline, setPipeline] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [sailors, setSailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    loadData();
  }, [selectedVacancy]);

  const loadData = async () => {
    try {
      setLoading(true);
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
      toast.error(language === 'ru' ? '\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const sailorMap = useMemo(() => {
    const map = {};
    sailors.forEach(s => { map[s.id] = s; });
    return map;
  }, [sailors]);

  const vacancyMap = useMemo(() => {
    const map = {};
    vacancies.forEach(v => { map[v.id] = v; });
    return map;
  }, [vacancies]);

  const getSailorName = useCallback((id) => sailorMap[id]?.full_name || '-', [sailorMap]);
  const getSailorPosition = useCallback((id) => sailorMap[id]?.position || '-', [sailorMap]);
  const getVacancyInfo = useCallback((id) => {
    const v = vacancyMap[id];
    return v ? `${v.position} - ${v.vessel_name}` : '-';
  }, [vacancyMap]);

  const cardsByStage = useMemo(() => {
    const result = {};
    stages.forEach(s => { result[s.id] = []; });
    pipeline.forEach(card => {
      if (result[card.stage]) {
        result[card.stage].push(card);
      }
    });
    // Sort by order within each stage
    Object.keys(result).forEach(key => {
      result[key].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return result;
  }, [pipeline]);

  const findStageForCard = (cardId) => {
    for (const [stageId, cards] of Object.entries(cardsByStage)) {
      if (cards.some(c => c.id === cardId)) return stageId;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const card = pipeline.find(c => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeStage = findStageForCard(active.id);
    // Determine target stage: could be another card or a column
    let overStage = findStageForCard(over.id);
    if (!overStage) {
      // Check if over.id is a stage id (dropped on empty column area)
      const stageMatch = stages.find(s => s.id === over.id);
      if (stageMatch) overStage = stageMatch.id;
    }

    if (!activeStage || !overStage || activeStage === overStage) return;

    // Move card between stages optimistically
    setPipeline(prev => {
      const updated = prev.map(c => {
        if (c.id === active.id) {
          return { ...c, stage: overStage };
        }
        return c;
      });
      return updated;
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const card = pipeline.find(c => c.id === active.id);
    if (!card) return;

    // Determine final stage
    let targetStage = findStageForCard(over.id);
    if (!targetStage) {
      const stageMatch = stages.find(s => s.id === over.id);
      if (stageMatch) targetStage = stageMatch.id;
    }
    if (!targetStage) targetStage = card.stage;

    // Determine order within stage
    const stageCards = pipeline.filter(c => c.stage === targetStage && c.id !== active.id);
    const overIndex = stageCards.findIndex(c => c.id === over.id);
    const newOrder = overIndex >= 0 ? overIndex : stageCards.length;

    // Update backend
    try {
      await updatePipeline(card.id, { stage: targetStage, order: newOrder });
    } catch (error) {
      toast.error(language === 'ru' ? '\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F' : 'Update failed');
      loadData(); // Revert on error
    }
  };

  const handleRemoveCard = async (cardId) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await removeFromPipeline(cardId);
      setPipeline(prev => prev.filter(p => p.id !== cardId));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  return (
    <div className="animate-fade-in h-full flex flex-col" data-testid="pipeline-page">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white">{t('pipeline')}</h1>
          <p className="text-slate-500 mt-1">
            {language === 'ru' ? '\u0412\u043E\u0440\u043E\u043D\u043A\u0430 \u0442\u0440\u0443\u0434\u043E\u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430' : 'Hiring Pipeline'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedVacancy}
            onChange={(e) => setSelectedVacancy(e.target.value)}
            className="px-4 py-2 bg-maritime-card border border-slate-800 rounded-md text-slate-100 focus:border-primary"
            data-testid="vacancy-filter"
          >
            <option value="">{language === 'ru' ? '\u0412\u0441\u0435 \u0432\u0430\u043A\u0430\u043D\u0441\u0438\u0438' : 'All Vacancies'}</option>
            {vacancies.map(v => (
              <option key={v.id} value={v.id}>{v.position} - {v.vessel_name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors"
            data-testid="add-pipeline-btn"
          >
            <Plus size={18} />
            {t('add')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 grid grid-cols-6 gap-4">
          {stages.map((_, i) => (
            <div key={i} className="h-96 bg-maritime-card border border-slate-800 rounded-md animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 min-w-max h-full pb-4">
              {stages.map((stage) => {
                const cards = cardsByStage[stage.id] || [];
                return (
                  <DroppableColumn key={stage.id} stage={stage} cards={cards} language={language}>
                    {cards.map((card) => (
                      <SortableCard
                        key={card.id}
                        card={card}
                        getSailorName={getSailorName}
                        getSailorPosition={getSailorPosition}
                        getVacancyInfo={getVacancyInfo}
                        onRemove={handleRemoveCard}
                        onEdit={setEditingCard}
                        language={language}
                      />
                    ))}
                  </DroppableColumn>
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeCard ? (
              <CardOverlay
                card={activeCard}
                getSailorName={getSailorName}
                getSailorPosition={getSailorPosition}
                getVacancyInfo={getVacancyInfo}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSuccess={() => { setEditingCard(null); loadData(); }}
        />
      )}

      {showAddModal && (
        <AddToPipelineModal
          sailors={sailors}
          vacancies={vacancies}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); loadData(); }}
        />
      )}
    </div>
  );
}

// Edit card modal
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-maritime-card border border-slate-800 rounded-md w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-white" data-testid="edit-card-modal-title">
            {language === 'ru' ? '\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443' : 'Edit Card'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200" data-testid="close-edit-modal">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0432\u0438\u0434\u0435\u043E\u0437\u0432\u043E\u043D\u043E\u043A' : 'Video Call Link'}
            </label>
            <input
              type="url"
              value={formData.interview_link}
              onChange={(e) => setFormData({...formData, interview_link: e.target.value})}
              placeholder="https://meet.google.com/..."
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              data-testid="edit-interview-link"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              data-testid="edit-notes"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              data-testid="cancel-edit-btn"
            >{t('cancel')}</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors disabled:opacity-50"
              data-testid="save-edit-btn"
            >{loading ? t('loading') : t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add to pipeline modal
const AddToPipelineModal = ({ sailors, vacancies, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sailor_id: sailors[0]?.id || '',
    vacancy_id: vacancies[0]?.id || '',
    stage: 'contact',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addToPipeline(formData);
      toast.success(t('success'));
      onSuccess();
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-maritime-card border border-slate-800 rounded-md w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-white" data-testid="add-pipeline-modal-title">
            {language === 'ru' ? '\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u0432\u043E\u0440\u043E\u043D\u043A\u0443' : 'Add to Pipeline'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200" data-testid="close-add-pipeline-modal">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? '\u041C\u043E\u0440\u044F\u043A' : 'Sailor'} *
            </label>
            <select
              value={formData.sailor_id}
              onChange={(e) => setFormData({...formData, sailor_id: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
              data-testid="pipeline-sailor-select"
            >
              {sailors.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} - {s.position}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? '\u0412\u0430\u043A\u0430\u043D\u0441\u0438\u044F' : 'Vacancy'} *
            </label>
            <select
              value={formData.vacancy_id}
              onChange={(e) => setFormData({...formData, vacancy_id: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
              data-testid="pipeline-vacancy-select"
            >
              {vacancies.map(v => (
                <option key={v.id} value={v.id}>{v.position} - {v.vessel_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? '\u042D\u0442\u0430\u043F' : 'Stage'}
            </label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({...formData, stage: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              data-testid="pipeline-stage-select"
            >
              {stages.map(s => (
                <option key={s.id} value={s.id}>{language === 'ru' ? s.labelRu : s.labelEn}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={2}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              data-testid="pipeline-notes"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              data-testid="cancel-add-pipeline-btn"
            >{t('cancel')}</button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors disabled:opacity-50"
              data-testid="save-pipeline-btn"
            >{loading ? t('loading') : t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
