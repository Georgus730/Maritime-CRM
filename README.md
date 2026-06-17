# Maritime CRM - система управления морскими экипажами

## Описание

MaritimeCRM - это профессиональная система управления морскими экипажами (Maritime Crew Management System), разработанная для рекрутинговых компаний, работающих в морской индустрии.

## Технологии

- **Frontend**: React + Tailwind CSS + Lucide React
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Email**: SendGrid API

## Основные функции

- 📊 Дашборд с статистикой и уведомлениями
- 👥 Управление моряками (карточки с вкладками)
- 🏢 Управление судовладельцами
- 💼 Вакансии с умным подбором кандидатов
- 📋 Контракты и рейсы
- 🔄 Воронка трудоустройства (Kanban)
- 🔔 Уведомления об истекающих документах
- 🌐 Мультиязычность (Русский/Английский)

## Запуск

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend

```
bash
cd frontend
npm install
npm start
```

## Демо-данные

После запуска нажмите "Загрузить демо-данные" на странице входа для создания тестовых данных.

### Демо-аккаунты
- Admin: admin@crewcrm.com / admin123
- Manager: manager@crewcrm.com / manager123

## Цветовая схема

Тёмно-синяя тема в стиле Maritime Tech:
- Основной фон: #020617 (глубокое море)
- Карточки: #0F172A
- Акцент: #0EA5E9 (небесно-голубой)
- Статус "доступен": #10B981 (радарный зелёный)
- Предупреждение: #F59E0B (янтарный)
- Опасность: #EF4444 (красный)

Git Status
Коммит создан локально:


c7e0c41 feat: Maritime CRM system with FastAPI backend and React frontend
Для запуска:


# Backend
cd backend
pip install -r requirements.txt
python server.py

# Frontend  
cd frontend
npm install
npm start
Для пуша на GitHub требуется авторизация. Выполните в терминале:


gh auth login
# или
git push -u origin main