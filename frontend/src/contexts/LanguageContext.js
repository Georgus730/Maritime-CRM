import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ru: {
    // Navigation
    dashboard: 'Панель управления',
    sailors: 'Моряки',
    companies: 'Компании',
    vacancies: 'Вакансии',
    contracts: 'Контракты',
    pipeline: 'Воронка',
    settings: 'Настройки',
    logout: 'Выход',
    
    // Dashboard
    totalSailors: 'Всего моряков',
    availableSailors: 'Доступны',
    openVacancies: 'Открытые вакансии',
    activeContracts: 'Активные контракты',
    totalCompanies: 'Компании',
    expiringDocuments: 'Истекающие документы',
    upcomingRotations: 'Ближайшие ротации',
    recentSailors: 'Новые резюме',
    daysLeft: 'дней осталось',
    
    // Status
    available: 'Доступен',
    onVoyage: 'В рейсе',
    notAvailable: 'Недоступен',
    open: 'Открыта',
    inProgress: 'В работе',
    closed: 'Закрыта',
    atSea: 'Судно в море',
    
    // Contract status
    preparation: 'Подготовка документов',
    flight: 'Перелет',
    onBoard: 'На борту',
    completed: 'Завершен',
    
    // Pipeline stages
    contact: 'Контакт',
    interview: 'Собеседование',
    offer: 'Оффер',
    documents: 'Документы',
    joined: 'На борту',
    
    // Vessel types
    tanker: 'Танкер',
    bulkCarrier: 'Балкер',
    container: 'Контейнеровоз',
    passenger: 'Пассажирское',
    generalCargo: 'Сухогруз',
    
    // Actions
    add: 'Добавить',
    edit: 'Редактировать',
    delete: 'Удалить',
    save: 'Сохранить',
    cancel: 'Отмена',
    search: 'Поиск',
    filter: 'Фильтр',
    findCandidates: 'Найти кандидатов',
    sendNotifications: 'Отправить уведомления',
    
    // Form fields
    fullName: 'ФИО',
    email: 'Email',
    phone: 'Телефон',
    position: 'Должность',
    nationality: 'Гражданство',
    birthDate: 'Дата рождения',
    status: 'Статус',
    rating: 'Рейтинг',
    englishLevel: 'Уровень английского',
    notes: 'Заметки',
    vesselName: 'Название судна',
    vesselType: 'Тип судна',
    salary: 'Зарплата',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    requirements: 'Требования',
    company: 'Компания',
    country: 'Страна',
    flag: 'Флаг',
    
    // Tabs
    personalData: 'Личные данные',
    documentsTab: 'Документы',
    experience: 'Опыт работы',
    ratingTab: 'Рейтинг',
    
    // Auth
    login: 'Вход',
    password: 'Пароль',
    signIn: 'Войти',
    invalidCredentials: 'Неверный email или пароль',
    
    // Messages
    loading: 'Загрузка...',
    noData: 'Нет данных',
    success: 'Успешно',
    error: 'Ошибка',
    confirmDelete: 'Вы уверены, что хотите удалить?',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    sailors: 'Sailors',
    companies: 'Companies',
    vacancies: 'Vacancies',
    contracts: 'Contracts',
    pipeline: 'Pipeline',
    settings: 'Settings',
    logout: 'Logout',
    
    // Dashboard
    totalSailors: 'Total Sailors',
    availableSailors: 'Available',
    openVacancies: 'Open Vacancies',
    activeContracts: 'Active Contracts',
    totalCompanies: 'Companies',
    expiringDocuments: 'Expiring Documents',
    upcomingRotations: 'Upcoming Rotations',
    recentSailors: 'Recent Resumes',
    daysLeft: 'days left',
    
    // Status
    available: 'Available',
    onVoyage: 'On Voyage',
    notAvailable: 'Not Available',
    open: 'Open',
    inProgress: 'In Progress',
    closed: 'Closed',
    atSea: 'At Sea',
    
    // Contract status
    preparation: 'Document Preparation',
    flight: 'In Transit',
    onBoard: 'On Board',
    completed: 'Completed',
    
    // Pipeline stages
    contact: 'Contact',
    interview: 'Interview',
    offer: 'Offer',
    documents: 'Documents',
    joined: 'Joined',
    
    // Vessel types
    tanker: 'Tanker',
    bulkCarrier: 'Bulk Carrier',
    container: 'Container',
    passenger: 'Passenger',
    generalCargo: 'General Cargo',
    
    // Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    findCandidates: 'Find Candidates',
    sendNotifications: 'Send Notifications',
    
    // Form fields
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    position: 'Position',
    nationality: 'Nationality',
    birthDate: 'Birth Date',
    status: 'Status',
    rating: 'Rating',
    englishLevel: 'English Level',
    notes: 'Notes',
    vesselName: 'Vessel Name',
    vesselType: 'Vessel Type',
    salary: 'Salary',
    startDate: 'Start Date',
    endDate: 'End Date',
    requirements: 'Requirements',
    company: 'Company',
    country: 'Country',
    flag: 'Flag',
    
    // Tabs
    personalData: 'Personal Data',
    documentsTab: 'Documents',
    experience: 'Experience',
    ratingTab: 'Rating',
    
    // Auth
    login: 'Login',
    password: 'Password',
    signIn: 'Sign In',
    invalidCredentials: 'Invalid email or password',
    
    // Messages
    loading: 'Loading...',
    noData: 'No data',
    success: 'Success',
    error: 'Error',
    confirmDelete: 'Are you sure you want to delete?',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('crewcrm_language');
    return saved || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('crewcrm_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ru' ? 'en' : 'ru');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

