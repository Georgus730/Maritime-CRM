# TODO — eslint warnings (react-hooks/exhaustive-deps, no-unused-vars)

- [x] Проверить и исправить react-hooks/exhaustive-deps в `frontend/src/pages/CompaniesPage.js` (useCallback + корректные зависимости).

- [ ] Пробежаться по остальным страницам под `frontend/src/pages/*.js` и исправить аналогичные предупреждения там, где возможно, без `eslint-disable-next-line`.
- [ ] Убедиться, что отсутствуют `no-unused-vars` (убрать неиспользуемые переменные/импорты или использовать их).
- [ ] Запустить `npm test`/`npm run build` (или хотя бы `npm run build`) в `frontend` и убедиться, что предупреждения ушли.

