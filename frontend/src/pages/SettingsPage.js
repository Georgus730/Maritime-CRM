import React, { useState, useEffect } from 'react';
import { 
  Settings,
  User,
  Users,
  Plus,
  Trash2,
  Shield,
  UserCog,
  UserCheck,
  Globe
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getUsers, createUser, deleteUser } from '../utils/api';
import { cn } from '../utils/helpers';
import { toast } from 'sonner';

const roleIcons = {
  admin: Shield,
  manager: UserCog,
  hr: UserCheck
};

const roleColors = {
  admin: 'bg-red-950/30 text-red-400 border-red-900/50',
  manager: 'bg-sky-950/30 text-sky-400 border-sky-900/50',
  hr: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
};

export default function SettingsPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки' : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      toast.error(language === 'ru' ? 'Нельзя удалить себя' : 'Cannot delete yourself');
      return;
    }
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  return (
    <div className="animate-fade-in" data-testid="settings-page">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-white">{t('settings')}</h1>
        <p className="text-slate-500 mt-1">
          {language === 'ru' ? 'Настройки системы и пользователей' : 'System and user settings'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-maritime-card border border-slate-800 rounded-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-md">
              <Globe className="text-primary" size={20} />
            </div>
            <h2 className="font-heading text-lg font-semibold text-white">
              {language === 'ru' ? 'Язык интерфейса' : 'Interface Language'}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => language !== 'ru' && toggleLanguage()}
              className={cn(
                "flex-1 py-3 rounded-md font-medium transition-colors",
                language === 'ru'
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
              data-testid="lang-ru-btn"
            >
              Русский
            </button>
            <button
              onClick={() => language !== 'en' && toggleLanguage()}
              className={cn(
                "flex-1 py-3 rounded-md font-medium transition-colors",
                language === 'en'
                  ? "bg-primary text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              )}
              data-testid="lang-en-btn"
            >
              English
            </button>
          </div>
        </div>

        <div className="bg-maritime-card border border-slate-800 rounded-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-md">
              <User className="text-primary" size={20} />
            </div>
            <h2 className="font-heading text-lg font-semibold text-white">
              {language === 'ru' ? 'Текущий пользователь' : 'Current User'}
            </h2>
          </div>
          {currentUser && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">{language === 'ru' ? 'Имя' : 'Name'}</p>
                <p className="text-slate-200">{currentUser.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-slate-200 font-mono text-sm">{currentUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">{language === 'ru' ? 'Роль' : 'Role'}</p>
                <span className={cn(
                  "px-2 py-1 text-xs font-mono rounded border",
                  roleColors[currentUser.role] || roleColors.hr
                )}>
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-maritime-card border border-slate-800 rounded-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-md">
              <Settings className="text-primary" size={20} />
            </div>
            <h2 className="font-heading text-lg font-semibold text-white">
              {language === 'ru' ? 'О системе' : 'About System'}
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Версия' : 'Version'}</p>
              <p className="text-slate-200 font-mono">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Название' : 'Name'}</p>
              <p className="text-slate-200">MaritimeCRM</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{language === 'ru' ? 'Технологии' : 'Technologies'}</p>
              <p className="text-slate-200 text-sm">React, FastAPI, MongoDB</p>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-6 bg-maritime-card border border-slate-800 rounded-md overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-primary" size={20} />
              <h2 className="font-heading text-lg font-semibold text-white">
                {language === 'ru' ? 'Управление пользователями' : 'User Management'}
              </h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-md transition-colors"
              data-testid="add-user-btn"
            >
              <Plus size={18} />
              {t('add')}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">{t('loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <th className="px-6 py-3 text-left">{language === 'ru' ? 'Имя' : 'Name'}</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">{language === 'ru' ? 'Роль' : 'Role'}</th>
                    <th className="px-6 py-3 text-right">{language === 'ru' ? 'Действия' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const RoleIcon = roleIcons[user.role] || User;
                    return (
                      <tr 
                        key={user.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        data-testid={`user-row-${user.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-md">
                              <RoleIcon className="text-slate-400" size={16} />
                            </div>
                            <span className="text-slate-200">{user.full_name}</span>
                            {user.id === currentUser.id && (
                              <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                                {language === 'ru' ? 'Вы' : 'You'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-slate-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 text-xs font-mono rounded border",
                            roleColors[user.role] || roleColors.hr
                          )}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 hover:bg-red-950/30 rounded-md transition-colors text-slate-400 hover:text-red-400"
                              data-testid={`delete-user-${user.id}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

const AddUserModal = ({ onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'manager'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(formData);
      toast.success(t('success'));
      onSuccess();
    } catch (error) {
      if (error.response?.data?.detail === 'Email already registered') {
        toast.error(language === 'ru' ? 'Email уже зарегистрирован' : 'Email already registered');
      } else {
        toast.error(t('error'));
      }
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
        <div className="p-6 border-b border-slate-800">
          <h2 className="font-heading text-2xl font-semibold text-white">
            {language === 'ru' ? 'Добавить пользователя' : 'Add User'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('fullName')} *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
              data-testid="user-name-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
              data-testid="user-email-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('password')} *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
              required
              minLength={6}
              data-testid="user-password-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {language === 'ru' ? 'Роль' : 'Role'}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-md text-slate-100"
            >
              <option value="manager">{language === 'ru' ? 'Менеджер' : 'Manager'}</option>
              <option value="hr">{language === 'ru' ? 'Кадровик' : 'HR'}</option>
              <option value="admin">{language === 'ru' ? 'Администратор' : 'Administrator'}</option>
            </select>
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
              data-testid="save-user-btn"
            >
              {loading ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

