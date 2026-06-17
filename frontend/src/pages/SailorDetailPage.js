import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  User, 
  FileText, 
  Ship, 
  Star,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSailor, updateSailor, deleteSailor } from '../utils/api';
import { cn, formatDate, daysUntil, getVesselTypeLabel } from '../utils/helpers';
import { toast } from 'sonner';

const tabs = [
  { id: 'personal', icon: User, labelRu: 'Личные данные', labelEn: 'Personal Data' },
  { id: 'documents', icon: FileText, labelRu: 'Документы', labelEn: 'Documents' },
  { id: 'experience', icon: Ship, labelRu: 'Опыт работы', labelEn: 'Experience' },
  { id: 'rating', icon: Star, labelRu: 'Рейтинг', labelEn: 'Rating' },
];

export default function SailorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [sailor, setSailor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSailor();
  }, [id]);

  const loadSailor = async () => {
    try {
      const response = await getSailor(id);
      setSailor(response.data);
      setFormData(response.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Моряк не найден' : 'Sailor not found');
      navigate('/sailors');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateSailor(id, formData);
      setSailor(formData);
      setEditing(false);
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteSailor(id);
      toast.success(t('success'));
      navigate('/sailors');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-64 bg-maritime-card border border-slate-800 rounded-md skeleton" />
      </div>
    );
  }

  if (!sailor) return null;

  return (
    <div className="animate-fade-in" data-testid="sailor-detail-page">
      {/* Header */}
      <div className="mb-6">
        <Link 
          to="/sailors" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          {language === 'ru' ? 'Назад к списку' : 'Back to list'}
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">{sailor.full_name}</h1>
            {sailor.full_name_en && (
              <p className="text-slate-500">{sailor.full_name_en}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-slate-400">{sailor.position}</span>
              <span className={cn(
                "px-2 py-0.5 text-xs font-mono rounded-sm",
                sailor.status === 'available' && "status-available",
                sailor.status === 'on_voyage' && "status-on-voyage",
                sailor.status === 'not_available' && "status-not-available"
              )}>
                {t(sailor.status === 'available' ? 'available' : sailor.status === 'on_voyage' ? 'onVoyage' : 'notAvailable')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => { setFormData(sailor); setEditing(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                >
                  <X size={18} />
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md transition-colors"
                  data-testid="save-changes-btn"
                >
                  <Save size={18} />
                  {t('save')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                  data-testid="edit-sailor-btn"
                >
                  <Edit size={18} />
                  {t('edit')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-md transition-colors"
                  data-testid="delete-sailor-btn"
                >
                  <Trash2 size={18} />
                  {t('delete')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-maritime-card/50 p-1 rounded-md border border-slate-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon size={18} />
            {language === 'ru' ? tab.labelRu : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-maritime-card border border-slate-800 rounded-md p-6">
        {activeTab === 'personal' && (
          <PersonalTab 
            data={formData} 
            editing={editing} 
            onChange={(updates) => setFormData({...formData, ...updates})} 
            language={language}
            t={t}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab 
            documents={formData.documents || []} 
            editing={editing}
            onChange={(docs) => setFormData({...formData, documents: docs})}
            language={language}
            t={t}
          />
        )}
        {activeTab === 'experience' && (
          <ExperienceTab 
            experience={formData.experience || []} 
            editing={editing}
            onChange={(exp) => setFormData({...formData, experience: exp})}
            language={language}
            t={t}
          />
        )}
        {activeTab === 'rating' && (
          <RatingTab 
            data={formData} 
            editing={editing}
            onChange={(updates) => setFormData({...formData, ...updates})}
            language={language}
            t={t}
          />
        )}
      </div>
    </div>
  );
}

const PersonalTab = ({ data, editing, onChange, language, t }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-white mb-4">
        {language === 'ru' ? 'Основная информация' : 'Basic Information'}
      </h3>
      <Field label={t('fullName')} value={data.full_name} editing={editing} onChange={v => onChange({full_name: v})} />
      <Field label={`${t('fullName')} (EN)`} value={data.full_name_en} editing={editing} onChange={v => onChange({full_name_en: v})} />
      <Field label={t('birthDate')} value={formatDate(data.birth_date)} type="date" editing={editing} onChange={v => onChange({birth_date: v})} rawValue={data.birth_date?.split('T')[0]} />
      <Field label={t('nationality')} value={data.nationality} editing={editing} onChange={v => onChange({nationality: v})} />
      <Field label={t('position')} value={data.position} editing={editing} onChange={v => onChange({position: v})} />
    </div>
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-semibold text-white mb-4">
        {language === 'ru' ? 'Контакты' : 'Contacts'}
      </h3>
      <Field label={t('phone')} value={data.phone} icon={Phone} editing={editing} onChange={v => onChange({phone: v})} />
      <Field label={t('email')} value={data.email} icon={Mail} editing={editing} onChange={v => onChange({email: v})} />
      <Field label="WhatsApp" value={data.whatsapp} icon={MessageCircle} editing={editing} onChange={v => onChange({whatsapp: v})} />
      <Field label="Telegram" value={data.telegram} icon={MessageCircle} editing={editing} onChange={v => onChange({telegram: v})} />
    </div>
  </div>
);

const Field = ({ label, value, icon: Icon, editing, onChange, type = 'text', rawValue }) => (
  <div>
    <label className="block text-sm text-slate-500 mb-1">{label}</label>
    {editing ? (
      <input
        type={type === 'date' ? 'date' : 'text'}
        value={type === 'date' ? (rawValue || '') : (value || '')}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
      />
    ) : (
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-slate-500" />}
        <span className="text-slate-200">{value || '-'}</span>
      </div>
    )}
  </div>
);

const DocumentsTab = ({ documents, editing, onChange, language, t }) => {
  const addDocument = () => {
    onChange([...documents, {
      doc_type: '',
      number: '',
      issue_date: new Date().toISOString(),
      expiry_date: new Date().toISOString(),
      issuing_authority: ''
    }]);
  };

  const removeDocument = (index) => {
    onChange(documents.filter((_, i) => i !== index));
  };

  const updateDocument = (index, field, value) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-white">
          {language === 'ru' ? 'Документы моряка' : 'Sailor Documents'}
        </h3>
        {editing && (
          <button
            onClick={addDocument}
            className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-sm"
          >
            <Plus size={14} />
            {t('add')}
          </button>
        )}
      </div>
      
      {documents.length === 0 ? (
        <p className="text-slate-500 text-center py-8">{t('noData')}</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => {
            const days = daysUntil(doc.expiry_date);
            const isExpiring = days !== null && days <= 90;
            const isCritical = days !== null && days <= 30;
            
            return (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-md border",
                  isCritical && "doc-expiring",
                  isExpiring && !isCritical && "doc-warning",
                  !isExpiring && "bg-slate-900/50 border-slate-800"
                )}
              >
                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      value={doc.doc_type}
                      onChange={(e) => updateDocument(index, 'doc_type', e.target.value)}
                      placeholder={language === 'ru' ? 'Тип документа' : 'Document type'}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                    />
                    <input
                      type="text"
                      value={doc.number}
                      onChange={(e) => updateDocument(index, 'number', e.target.value)}
                      placeholder={language === 'ru' ? 'Номер' : 'Number'}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                    />
                    <input
                      type="date"
                      value={doc.expiry_date?.split('T')[0] || ''}
                      onChange={(e) => updateDocument(index, 'expiry_date', new Date(e.target.value).toISOString())}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                    />
                    <button
                      onClick={() => removeDocument(index)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-md text-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {isExpiring && <AlertTriangle className="text-red-400" size={16} />}
                        <span className="font-medium text-slate-200">{doc.doc_type}</span>
                      </div>
                      <span className="font-mono text-sm text-slate-500">{doc.number}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">
                        {language === 'ru' ? 'Действителен до:' : 'Valid until:'}
                      </p>
                      <p className={cn(
                        "font-mono",
                        isCritical && "text-red-400",
                        isExpiring && !isCritical && "text-amber-400",
                        !isExpiring && "text-slate-300"
                      )}>
                        {formatDate(doc.expiry_date)}
                      </p>
                      {days !== null && days <= 90 && (
                        <span className={cn(
                          "text-xs",
                          isCritical ? "text-red-400" : "text-amber-400"
                        )}>
                          {days} {language === 'ru' ? 'дней' : 'days'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ExperienceTab = ({ experience, editing, onChange, language, t }) => {
  const addExperience = () => {
    onChange([...experience, {
      vessel_name: '',
      vessel_type: 'container',
      flag: '',
      company: '',
      position: '',
      start_date: new Date().toISOString(),
      end_date: null
    }]);
  };

  const removeExperience = (index) => {
    onChange(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg font-semibold text-white">
          {language === 'ru' ? 'Опыт работы на судах' : 'Sea Service Experience'}
        </h3>
        {editing && (
          <button
            onClick={addExperience}
            className="flex items-center gap-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-sm"
          >
            <Plus size={14} />
            {t('add')}
          </button>
        )}
      </div>

      {experience.length === 0 ? (
        <p className="text-slate-500 text-center py-8">{t('noData')}</p>
      ) : (
        <div className="space-y-4">
          {experience.map((exp, index) => (
            <div key={index} className="p-4 bg-slate-900/50 border border-slate-800 rounded-md">
              {editing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={exp.vessel_name}
                    onChange={(e) => updateExperience(index, 'vessel_name', e.target.value)}
                    placeholder={language === 'ru' ? 'Название судна' : 'Vessel name'}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                  />
                  <select
                    value={exp.vessel_type}
                    onChange={(e) => updateExperience(index, 'vessel_type', e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                  >
                    <option value="tanker">{getVesselTypeLabel('tanker', language)}</option>
                    <option value="bulk_carrier">{getVesselTypeLabel('bulk_carrier', language)}</option>
                    <option value="container">{getVesselTypeLabel('container', language)}</option>
                    <option value="passenger">{getVesselTypeLabel('passenger', language)}</option>
                    <option value="general_cargo">{getVesselTypeLabel('general_cargo', language)}</option>
                  </select>
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder={language === 'ru' ? 'Компания' : 'Company'}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                  />
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                    placeholder={language === 'ru' ? 'Должность' : 'Position'}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                  />
                  <input
                    type="text"
                    value={exp.flag}
                    onChange={(e) => updateExperience(index, 'flag', e.target.value)}
                    placeholder={language === 'ru' ? 'Флаг' : 'Flag'}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100 text-sm"
                  />
                  <button
                    onClick={() => removeExperience(index)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-md text-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Ship className="text-primary" size={16} />
                      <span className="font-medium text-slate-200">{exp.vessel_name}</span>
                      <span className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded-sm">
                        {getVesselTypeLabel(exp.vessel_type, language)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{exp.position} • {exp.company}</p>
                    <p className="text-xs text-slate-500 mt-1">{language === 'ru' ? 'Флаг:' : 'Flag:'} {exp.flag}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-slate-400">
                      {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : (language === 'ru' ? 'наст.вр.' : 'present')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RatingTab = ({ data, editing, onChange, language, t }) => {
  const renderStars = (rating, editable = false) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => editable && onChange({ rating: star })}
          disabled={!editable}
          className={cn(
            "transition-colors",
            editable && "cursor-pointer hover:scale-110"
          )}
        >
          <Star 
            size={24} 
            className={star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-700"} 
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-semibold text-white mb-4">
          {language === 'ru' ? 'Общий рейтинг' : 'Overall Rating'}
        </h3>
        <div className="flex items-center gap-4">
          {renderStars(data.rating || 3, editing)}
          <span className="text-2xl font-heading font-bold text-amber-400">{data.rating || 3}/5</span>
        </div>
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-white mb-4">
          {language === 'ru' ? 'Уровень английского' : 'English Level'}
        </h3>
        {editing ? (
          <select
            value={data.english_level || 'Basic'}
            onChange={(e) => onChange({ english_level: e.target.value })}
            className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
          >
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Good">Good</option>
            <option value="Fluent">Fluent</option>
          </select>
        ) : (
          <span className="px-3 py-1 bg-sky-950/30 text-sky-400 border border-sky-900/50 rounded-md text-sm">
            {data.english_level || 'Basic'}
          </span>
        )}
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-white mb-4">
          {language === 'ru' ? 'Заметки менеджера' : 'Manager Notes'}
        </h3>
        {editing ? (
          <textarea
            value={data.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
            placeholder={language === 'ru' ? 'Добавьте заметки...' : 'Add notes...'}
          />
        ) : (
          <p className="text-slate-300">{data.notes || (language === 'ru' ? 'Нет заметок' : 'No notes')}</p>
        )}
      </div>
    </div>
  );
};

