# Maritime-CRM — PRD

## Original Problem Statement
Глубокий анализ и оптимизация open-source проекта Maritime-CRM (управление морскими экипажами) из репозитория https://github.com/GeorgiyKuz/Maritime-CRM

## Architecture
- **Frontend**: React + Tailwind CSS + Lucide React + @dnd-kit
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Email**: SendGrid API (optional)
- **Auth**: JWT (passlib + python-jose)

## User Personas
1. **System Administrator** — управляет пользователями, полный доступ
2. **Crew Manager** — управляет моряками, вакансиями, компаниями, контрактами и воронкой

## Core Requirements
- CRUD для моряков, компаний, вакансий, контрактов
- Kanban-воронка трудоустройства с drag-and-drop
- Dashboard с агрегированной статистикой
- Уведомления об истекающих документах (SendGrid)
- Мультиязычность (RU/EN)

## What's Been Implemented (Jan 2026)
1. ✅ **Dashboard API оптимизация** — MongoDB $facet + $lookup агрегации вместо N+1 запросов
2. ✅ **Авто-создание индексов** при старте сервера
3. ✅ **Фикс seed-данных** — все сущности теперь содержат user_id
4. ✅ **Kanban Pipeline с @dnd-kit** — drag-and-drop, batch reorder, auto-order
5. ✅ **Модалки** — centered overlay с backdrop
6. ✅ **DashboardPage** — оптимизированная загрузка через единый /api/dashboard/summary

## Prioritized Backlog

### P0 (Critical) — Done
- [x] Dashboard API aggregation
- [x] Auto-indexes on startup
- [x] Seed data fix (user_id)
- [x] Pipeline DnD

### P1 (High)
- [ ] Рефакторинг server.py на модули (routes/, models/, services/)
- [ ] Pagination для list-эндпоинтов (sailors, companies, vacancies)
- [ ] React.lazy для страниц
- [ ] Мемоизация компонентов (React.memo, useMemo)

### P2 (Medium)
- [ ] Аналитика воронки (конверсия между этапами)
- [ ] Export данных (CSV/Excel)
- [ ] Фильтры + поиск на каждой странице
- [ ] Notifications center в UI

### P3 (Low)
- [ ] Dark/Light theme toggle
- [ ] Role-based access control (RBAC)
- [ ] Audit log
- [ ] File uploads (documents scanning)

## Next Tasks
1. Добавить pagination на list-эндпоинты (.limit() + skip)
2. React.lazy loading для страниц
3. Разнести server.py на модули
4. Аналитика воронки на дашборде
