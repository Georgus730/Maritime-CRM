# Полная инструкция по установке, запуску и использованию Maritime-CRM

## 🎯 Описание проекта

**Maritime-CRM** — профессиональная система управления морскими экипажами для рекрутинговых компаний. 

**Основные функции:**
- 👥 Управление моряками (профили, документы, опыт)
- 🏢 Судовладельцы и контакты
- 💼 Вакансии с умным подбором кандидатов
- 📋 Контракты и рейсы
- 🔄 Воронка трудоустройства (Kanban)
- 🔔 Уведомления об истекающих документах
- 📊 Дашборд со статистикой
- 🌐 Мультиязычность (RU/EN)

**Технологии:**
- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: FastAPI (Python) + MongoDB
- **Аутентификация**: JWT
- **Email**: SendGrid (опционально)

## 📋 Предварительные требования

### Обязательно:
```
Node.js 18+          https://nodejs.org/
Python 3.10+         https://python.org/
MongoDB 6+           https://mongodb.com/try/download/community
Git                  https://git-scm.com/
```

### Рекомендуется:
- **VS Code** с расширениями: Python, Prettier, Tailwind CSS IntelliSense
- **Postman** или **Thunder Client** для тестирования API

## 🚀 Установка (5 минут)

### 1. Клонируйте репозиторий
```bash
git clone https://github.com/GeorgiyKuz/Maritime-CRM.git
cd Maritime-CRM
```

### 2. Запустите MongoDB
**Windows (MongoDB Community):**
```bash
# Запустите как службу или через mongod.exe
mongod --dbpath C:\data\db
```
**Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Проверьте подключение:**
```bash
mongo mongodb://localhost:27017
```

### 3. Backend (FastAPI)
```bash
cd backend

# Создайте виртуальное окружение
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Установите зависимости
pip install -r requirements.txt

# Создайте .env файл (скопируйте из .env.example если есть)
echo MONGO_URL=mongodb://localhost:27017 > .env
echo DB_NAME=crewcrm >> .env
echo JWT_SECRET=your-super-secret-key-change-this >> .env
echo JWT_EXPIRATION_HOURS=24 >> .env
```

### 4. Frontend (React)
```bash
cd ../frontend

# Установите зависимости
npm install

# (опционально) Добавьте proxy в package.json:
# \"proxy\": \"http://localhost:8001\"
```

## ▶️ Запуск разработки

### Терминал 1: Backend
```bash
cd backend
venv\Scripts\activate
python server.py
```
**API будет доступно:** `http://localhost:8001`

**Проверьте здоровье:**
```
http://localhost:8001/api/health
```

### Терминал 2: Frontend
```bash
cd frontend
npm start
```
**Приложение откроется:** `http://localhost:3000`

## 🧪 Загрузка демо-данных

1. Откройте `http://localhost:3000/login`
2. **Демо-аккаунты:**
   ```
   Admin: admin@crewcrm.com / admin123
   Manager: manager@crewcrm.com / manager123
   ```
3. Нажмите **\"Загрузить демо-данные\"** — создастся:
   - 8 моряков с опытом
   - 4 судовладельца (Maersk, MSC, Sovcomflot, Carnival)
   - 8 вакансий
   - Контракты и pipeline

**Альтернатива через API:**
```bash
curl -X POST http://localhost:8001/api/seed
```

## 📱 Использование интерфейса

### 🔐 Авторизация
```
Главная → Login → Введите демо-данные
```

### 📊 Навигация (после входа)
```
🏠 Главная (Dashboard) — статистика, уведомления
👥 Моряки — список, фильтры, детальные карточки
🏢 Компании — судовладельцы, зарплатные шкалы
💼 Вакансии — размещение, статусы
📋 Контракты — управление рейсами
🔄 Pipeline — Kanban воронка найма
⚙️ Настройки — пользователи (только Admin)
```

### ✨ Ключевые возможности

**1. Моряки (Sailors):**
```
✅ Фильтры: статус, должность, поиск
✅ Карточки с рейтингом, статусом
✅ Детальная страница: документы (срок действия), опыт плаваний
✅ Вкладки: Документы | Опыт | Примечания
✅ ⚠️ Цветовая индикация истекающих документов
```

**2. Умный подбор (Smart Matching):**
```
В вакансии → \"Найти кандидатов\" → Автоподбор по опыту/должности
```

**3. Pipeline (Kanban):**
```
Этапы: Контакт → Интервью → Оффер → Документы → Присоединился → Завершено
Drag & Drop между колонками
```

**4. Дашборд:**
```
📈 Статистика: моряки/вакансии/контракты
🔔 Истекающие документы (ближайшие 90 дней)
🔄 Скоро ротация (контракты заканчиваются)
⭐ Недавно добавленные моряки
```

**5. Админ-панель (Settings):**
```
👤 Управление пользователями (только Admin)
```

## 🔧 API Документация (Swagger)

После запуска backend: `http://localhost:8001/docs`

**Основные endpoints:**
```
POST /api/auth/login     — авторизация
POST /api/seed           — демо-данные
GET  /api/sailors        — список моряков (?status=available&position=Captain)
GET  /api/dashboard/stats — статистика
GET  /api/matching/{vacancy_id} — умный подбор
```

## ⚙️ Конфигурация (.env в backend)

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=crewcrm
JWT_SECRET=your-very-secure-secret-key-here
JWT_EXPIRATION_HOURS=24

# Опционально для email-уведомлений
SENDGRID_API_KEY=your-sendgrid-key
SENDER_EMAIL=noreply@crewcrm.com
```

## 🚀 Продакшн-развертывание

### Docker Compose (рекомендуется)
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6
    ports:
      - \"27017:27017\"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - \"8001:8001\"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - \"3000:3000\"
    depends_on:
      - backend
volumes:
  mongodb_data:
```

**Запуск:**
```bash
docker-compose up -d
```

### Nginx + PM2 + Gunicorn
```
Backend: gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app
Frontend: npm run build → serve -s build
```

## 🐛 Устранение неисправностей

| Проблема | Решение |
|----------|---------|
| **MongoDB не подключается** | `mongod --dbpath C:\data\db`<br>`docker run -p 27017:27017 mongo` |
| **Backend 401 ошибки** | Проверьте JWT_SECRET в .env<br>Перезагрузите server.py |
| **Frontend не видит API** | Добавьте `\"proxy\": \"http://localhost:8001\"` в frontend/package.json |
| **CORS ошибки** | Backend CORS уже настроен `allow_origins=[\"*\"]` |
| **npm install падает** | `rm -rf node_modules package-lock.json && npm install` |
| **Python зависимости** | `pip install --upgrade pip && pip install -r requirements.txt` |

## 📱 Мобильная адаптивность
✅ Полностью адаптивный дизайн (TailwindCSS)
✅ Touch-friendly на планшетах/телефонах
✅ Dark theme по умолчанию

## 🔒 Безопасность
- ✅ JWT аутентификация (24ч)
- ✅ bcrypt хэширование паролей
- ✅ Role-based access (Admin/Manager)
- ✅ MongoDB ObjectId валидация
- ✅ Input sanitization (Pydantic)

## 📈 Roadmap
- [ ] Excel импорт/экспорт моряков
- [ ] SMS уведомления (Twilio)
- [ ] PDF генерация контрактов
- [ ] Расписание ротаций
- [ ] Интеграция с MarineTraffic API

## 📞 Поддержка
```
💬 Telegram: @TheSupremeObserver
📧 Email: georgijkuznecov933@gmail.com
```

---

**Готово к работе за 5 минут! 🚀**

**Ссылки после запуска:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8001/docs
- MongoDB: mongodb://localhost:27017/crewcrm

**Демо-данные создадут 8 моряков, 4 компании и 8 вакансий автоматически!**
