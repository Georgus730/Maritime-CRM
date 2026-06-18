# Guest Login Feature Implementation

## 📋 Обзор

Добавлена функция "гостевого" логина в Maritime CRM для демонстрации функционала заказчикам без необходимости регистрации.

## 🔧 Как это работает

### 1. Backend (`server.py`)

#### Новый API Endpoint
```
POST /api/auth/guest-login
```
- Не требует параметров
- Создаёт или получает фиксированного пользователя `guest@maritimecrm.demo`
- Возвращает JWT токен и данные пользователя с флагом `is_guest: true`

#### Модель User обновлена
- Добавлено поле `is_guest: bool = False` в `UserResponse`
- Позволяет фронтенду и бэкенду знать, является ли пользователь гостем

#### Функция защиты
```python
def check_guest_access(current_user: dict):
    if current_user.get("is_guest"):
        raise HTTPException(status_code=403, detail="Guest users cannot perform this action")
```
- Проверяет флаг `is_guest` перед опасными операциями

#### Защищённые операции
Гостевой пользователь **не может**:
- ❌ Удалять моряков (`DELETE /api/sailors/{id}`)
- ❌ Удалять компании (`DELETE /api/companies/{id}`)
- ❌ Удалять вакансии (`DELETE /api/vacancies/{id}`)
- ❌ Удалять контракты (`DELETE /api/contracts/{id}`)
- ❌ Удалять кандидатов из pipeline (`DELETE /api/pipeline/{id}`)
- ❌ Управлять пользователями (`DELETE /api/users/{id}`)

Гостевой пользователь **может**:
- ✅ Просматривать всех моряков
- ✅ Просматривать компании и вакансии
- ✅ Просматривать контракты и pipeline
- ✅ Просматривать статистику дашборда

### 2. Frontend (`LoginPage.js` & `AuthContext.js`)

#### Новый метод в AuthContext
```javascript
const loginAsGuest = async () => {
  const response = await axios.post(`${API_URL}/api/auth/guest-login`);
  // Сохраняет токен, устанавливает юзера
}
```

#### UI обновления
- Добавлена кнопка **"Войти как гость"** / **"Guest Login"** под формой логина
- Серая кнопка (`bg-slate-700`) для визуального различия от основного логина
- Информативный текст о ограничениях гостя
- Поддержка русского и английского языков

## 📊 Технический поток

```
User clicks "Guest Login"
         ↓
POST /api/auth/guest-login
         ↓
Backend creates/finds guest user with is_guest=true
         ↓
JWT token generated & returned
         ↓
Frontend stores token → sets user state
         ↓
Redirect to dashboard → User sees read-only interface
         ↓
If guest tries DELETE → 403 Forbidden: "Guest users cannot perform this action"
```

## 🔒 Безопасность

1. **Guest user фиксирован** - все гости используют одного и того же пользователя `guest@maritimecrm.demo`
2. **Флаг `is_guest`** - отмечает гостевые сессии на уровне БД
3. **Server-side validation** - проверки на бэкенде, не на фронтенде (нельзя обойти)
4. **401/403 ошибки** - правильные HTTP коды для аутентификации/авторизации

## 🚀 Использование

### Для заказчика
1. Открыть страницу логина
2. Нажать кнопку **"Войти как гость"** (не требует email/пароля)
3. Автоматический вход в систему
4. Просмотр всех данных CRM
5. Попытка удаления вернёт ошибку 403

### Для тестирования
```bash
# Backend должен быть запущен на http://localhost:8001
# Frontend на http://localhost:3000

# Кнопка гостевого логина доступна на LoginPage
# Нет необходимости в предварительной регистрации или seed-данных
```

## 📝 Переводы

Поддерживаются русский и английский языки:
- **RU**: "Войти как гость"
- **EN**: "Guest Login"
- Описание ограничений на обоих языках

## ✅ Проверка работоспособности

1. ✓ Backend: Новый endpoint создаёт/находит guest user
2. ✓ Frontend: Кнопка видна на LoginPage
3. ✓ Auth: Токен генерируется и сохраняется
4. ✓ Protection: DELETE endpoints отклоняют гостевых пользователей
5. ✓ i18n: Текст переведён на русский
