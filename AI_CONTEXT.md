# Waitly — Полный контекст проекта для ИИ

## Трёхзвенная архитектура

```
┌─────────────────────────────────────────────────────┐
│  Админ-панель (React + Vite)                        │
│  👉 https://adminpanelreact-tawny.vercel.app        │
│  📁 D:\SaaS\admin_panel_react\                      │
├─────────────────────────────────────────────────────┤
│  Мобильное приложение (React Native + Expo)          │
│  👉 waitly-mobile (GitHub: kolomfolox-lab)          │
│  📁 D:\SaaS\waitly-mobile\                          │
├─────────────────────────────────────────────────────┤
│  Бэкенд (Django 5 + DRF + Celery + Daphne)          │
│  👉 https://api.moonlauncher.org                    │
│  👉 http://192.168.31.242:8000 (dev)                │
│  📁 D:\SaaS\waitly_backend\                         │
├─────────────────────────────────────────────────────┤
│  Киоск (React SPA, standalone)                      │
│  👉 https://kiosk-alpha-two.vercel.app              │
│  📁 D:\SaaS\kiosk\                                  │
└─────────────────────────────────────────────────────┘
```

## Быстрый старт (все компоненты)

### 1. Бэкенд (Django)
```bash
cd D:\SaaS\waitly_backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cp .env.example .env      # настроить переменные
python manage.py migrate
python manage.py seed_plans
python manage.py runserver 0.0.0.0:8000
```

### 2. Админ-панель (React)
```bash
cd D:\SaaS\admin_panel_react
npm install
npm run dev
```

### 3. Мобильное приложение (Expo)
```bash
cd D:\SaaS\waitly-mobile
npm install
npx expo start
```
- Expo Go на телефоне → сканировать QR
- Или эмулятор: `npx expo start --android` / `--ios`

### 4. Киоск (React SPA)
```bash
cd D:\SaaS\kiosk
npm install
npm run dev
```

## Структура проекта (общая)

### Мобильное приложение (`waitly-mobile/`)

```
waitly-mobile/
├── App.js                    # Точка входа — AuthGate + AppNavigator
├── src/
│   ├── api/
│   │   └── client.js         # Axios-клиент с JWT refresh, baseURL
│   ├── navigation/
│   │   └── AppNavigator.js   # Навигация: роль → стек экранов
│   ├── screens/
│   │   ├── auth/             # LoginScreen
│   │   ├── waiter/           # WaiterHome, TableScreen, OrderScreen...
│   │   ├── manager/          # ManagerDashboard, ShiftScreen...
│   │   ├── owner/            # OwnerDashboard, AnalyticsScreen...
│   │   ├── chef/             # KitchenBoard, CookingScreen...
│   │   ├── courier/          # CourierDashboard, CourierOrderDetails...
│   │   └── shared/           # ProfileScreen, NotificationsScreen...
│   ├── components/           # Переиспользуемые UI-компоненты
│   ├── context/
│   │   └── AuthContext.js    # AuthContext: login, logout, token store
│   └── i18n/                 # Локализация (ru, uz, en)
└── services/
    └── api.js                # ЛЕГАСИ-клиент (старые экраны)
```

### Админ-панель (`admin_panel_react/`)

```
admin_panel_react/
├── src/
│   ├── App.tsx               # Маршруты + PrivateRoute
│   ├── pages/                # DashboardPage, MenuPage, PricingPage...
│   ├── components/
│   │   └── app/
│   │       └── AppShell.tsx  # Боковое меню + роутинг по ролям
│   └── services/
│       └── api.ts            # API-клиенты по модулям
├── public/                   # Статика
└── dist/                     # Сборка (Vercel)
```

### Бэкенд Django (`waitly_backend/`)

```
waitly_backend/
├── config/
│   ├── settings.py           # ALLOWED_HOSTS, CORS, REST_FRAMEWORK
│   ├── urls.py               # Главные URL + api/v1/
│   ├── wsgi.py / asgi.py
│   └── celery.py
├── apps/
│   ├── accounts/             # User, Role, Profile
│   ├── restaurants/          # Restaurant, Branding, FeatureFlag
│   ├── orders/               # Order, OrderItem (state machine)
│   ├── menu/                 # Category, Dish, Modifier
│   ├── payments/             # MerchantConfig, PaymentTransaction
│   ├── subscriptions/        # SubscriptionPlan, SubscriptionKey
│   ├── admin_panel/          # Admin panel API endpoints
│   ├── analytics/            # AI insights, reports
│   ├── branding/             # White label, themes
│   ├── checklists/           # Opening/closing checklists
│   ├── crm/                  # Customer profiles
│   ├── hr/                   # Staff, shifts, payroll
│   ├── inventory/            # Stock, recipes, write-offs
│   ├── marketing/            # Promo, loyalty, surveys
│   ├── notifications/        # Push, SMS, Telegram
│   ├── public_api/           # Public API endpoints
│   ├── reviews/              # Reviews + AI analysis
│   ├── suppliers/            # Supplier orders, purchase orders
│   └── tables/               # Table management
```

## Роли и их экраны

| Роль | Мобильные экраны | Веб-страницы |
|------|-----------------|-------------|
| `WAITER` | WaiterHome, TableScreen, OrderScreen, CartScreen, BillScreen | /tables, /orders |
| `CHEF` | KitchenBoard, CookingScreen | /kitchen |
| `COOK` | KitchenBoard, CookingScreen | (через CHEF) |
| `HEAD_WAITER` | HeadWaiterDashboard, StaffManagementScreen, ShiftScreen | /shifts, /staff |
| `MANAGER` | ManagerDashboard, ShiftScreen, InventoryScreen | /dashboard, /staff, /inventory |
| `RESTAURANT_OWNER` | OwnerDashboard, AnalyticsScreen, InventoryScreen, StaffScreen | /dashboard, /analytics, /staff, /menu, /pricing |
| `CHAIN_OWNER` | OwnerDashboard, NetworksScreen | всё выше + /networks |
| `SUPER_ADMIN` | ProfileScreen | всё, системные настройки |
| `SHIFT_LEADER` | ShiftLeaderDashboard | /shift-leader |
| `DISPATCHER` | DispatcherDashboard | /dispatcher |
| `COURIER` | CourierDashboard, CourierOrderDetails | /courier |
| `ACCOUNTANT` | AccountantDashboard | /accountant |
| `MARKETER` | MarketerDashboard | /marketer |
| `ANALYST` | AnalystDashboard | /analyst |
| `SUPPORT` | SupportDashboard | /support |
| `AUDITOR` | AuditorDashboard | /auditor |
| `SUPPLIER` | SupplierDashboard | /supplier |
| `HEAD_CHEF` | KitchenTabs (shared with CHEF) | — |

## Ключевые API-эндпоинты (бэкенд)

### Аутентификация
```
POST /api/auth/login/           → JWT tokens
POST /api/auth/refresh/         → Refresh JWT
POST /api/auth/register/        → Register
GET  /api/auth/me/              → Current user + profile
```

### Подписки (PMF 8/10)
```
GET   /api/subscriptions/plans/               → Список тарифов
POST  /api/subscriptions/purchase/            → Купить подписку
POST  /api/subscriptions/keys/activate/       → Активировать ключ
GET   /api/subscriptions/keys/                → Мои ключи
```

### Заказы (state machine)
```
GET    /api/orders/                           → Заказы
POST   /api/orders/                           → Создать
POST   /api/orders/{id}/accept/               → Claim
POST   /api/orders/{id}/cooking/              → Start cooking
POST   /api/orders/{id}/ready/                → Ready
POST   /api/orders/{id}/serve/                → Serve
POST   /api/orders/{id}/pay/                  → Pay
POST   /api/orders/{id}/cancel/               → Cancel
```

### Меню
```
GET    /api/menu/categories/                  → Категории
GET    /api/menu/dishes/                      → Блюда
GET    /api/menu/modifiers/                   → Модификаторы
```

### Оплата
```
GET    /api/payments/merchant-configs/        → Настройки Payme/Click
POST   /api/payments/transactions/            → Создать платёж
```

## Навигация (AppNavigator.js)

```javascript
// role → screens mapping
const ROLE_SCREENS = {
  WAITER:            WaiterTabNavigator,
  CHEF:              ChefTabNavigator,
  COOK:              ChefTabNavigator,
  HEAD_WAITER:       HeadWaiterTabNavigator,
  MANAGER:           ManagerTabNavigator,
  RESTAURANT_OWNER:  OwnerTabNavigator,
  CHAIN_OWNER:       OwnerTabNavigator,
  COURIER:           CourierTabNavigator,
  SUPER_ADMIN:       OwnerTabNavigator,
  // SHIFT_LEADER, DISPATCHER, SUPPORT, AUDITOR, SUPPLIER — fallback на WaiterTab
};
```

## Feature Flags (бэкенд)

Флаги хранятся в `restaurants_featureflag`, привязаны к ресторану.
Управляются автоматически при активации подписки.

```
qr_menu, online_ordering, reviews, ai_analytics,
whatsapp_notifications, sms_notifications, push_notifications,
loyalty_program, promo_campaigns, self_service_kiosk,
public_api, reservation_system, checklists,
hr_module, supplier_module, multi_restaurant,
white_label, extended_analytics, telegram_bot
```

## Команды для разработки

```bash
# Бэкенд
python manage.py show_urls                          # Все URL
python manage.py seed_plans                         # Создать тарифы
python manage.py setup_periodic_tasks               # Celery Beat задачи
python manage.py check --deploy                     # Security audit

# Админ-панель
npm run build                                       # Production сборка

# Мобильное приложение
npx expo export -p web                              # Web-сборка
npx expo start --tunnel                             # Через тоннель (без WiFi)
npx expo run:android                                # Нативный Android
npx expo run:ios                                    # Нативный iOS

# Docker (продакшн)
docker-compose -f docker-compose.prod.yml up -d
```

## Продакшн-деплой

- **Бэкенд**: Oracle Cloud VM, docker-compose (Postgres + Redis + Nginx + Celery + Daphne)
- **Админ-панель**: Vercel (SPA, `adminpanelreact-tawny.vercel.app`)
- **Киоск**: Vercel (SPA, `kiosk-alpha-two.vercel.app`)
- **Мобильное**: Expo + App Store / Google Play или Web-сборка

## Важные замечания

1. **Мобильное приложение** использует два API-клиента:
   - `src/api/client.js` — новый (с JWT refresh, baseURL из env)
   - `services/api.js` — легаси (только для старых экранов)

2. **Киоск** работает полностью на мок-данных (`Promise.resolve(getMockMenu())`) — не требует API

3. **Security**: в `.env` есть захардкоженные секреты (DEBUG=True, OpenRouter API key, Telegram токен). Нужна ротация перед продакшном.

4. **Feature Flags**: все фичи включаются через подписку. Бесплатный тариф = базовые функции (QR-меню, заказы, отзывы). Бизнес = 299k UZS/мес, Enterprise = 799k UZS/мес.

5. **Все экраны подключены**: ChefDashboard — CHEF роль имеет KitchenTabs (использует KitchenDashboard), ChefDashboard доступен как запасной. HeadWaiterDashboard + StaffManagementScreen — HEAD_WAITER использует их вместо WaiterTabs.
