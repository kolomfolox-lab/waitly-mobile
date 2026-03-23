// ==========================================
// Waitly — Mock Data Layer
// All test data for running without backend API
// ==========================================

// ---- Mock User ----
export const MOCK_USER = {
    id: 1,
    phone_number: '+998901234567',
    full_name: 'Азиз Каримов',
    role: 'WAITER',
    restaurant: {
        id: 'r1',
        name: 'Evos Lounge',
    },
};

// ---- Mock Tables ----
export const MOCK_TABLES = [
    { id: 't1', number: 1, status: 'AVAILABLE', capacity: 4, label: 'У входа', is_occupied: false },
    { id: 't2', number: 2, status: 'OCCUPIED', capacity: 2, label: 'Мария И.', subLabel: '25 мин', is_occupied: true },
    { id: 't3', number: 3, status: 'OCCUPIED', capacity: 6, label: 'Равшан К.', subLabel: '45 мин', is_occupied: true },
    { id: 't4', number: 4, status: 'AVAILABLE', capacity: 4, label: 'У окна', is_occupied: false },
    { id: 't5', number: 5, status: 'AVAILABLE', capacity: 2, label: 'Готов к приему', is_occupied: false },
    { id: 't6', number: 6, status: 'RESERVED', capacity: 4, label: '4 гостя', subLabel: 'Через 15 мин', time: '18:00', is_occupied: false },
    { id: 't7', number: 7, status: 'AVAILABLE', capacity: 8, label: 'VIP зал', is_occupied: false },
    { id: 't8', number: 8, status: 'AVAILABLE', capacity: 2, label: 'У бара', is_occupied: false },
    { id: 't9', number: 9, status: 'OCCUPIED', capacity: 4, label: 'Дильшод М.', subLabel: '10 мин', is_occupied: true },
    { id: 't10', number: 10, status: 'RESERVED', capacity: 6, label: '6 гостей', subLabel: 'Через 30 мин', time: '19:00', is_occupied: false },
    { id: 't11', number: 11, status: 'AVAILABLE', capacity: 2, label: 'Терраса', is_occupied: false },
    { id: 't12', number: 12, status: 'RESERVED', capacity: 8, label: '8 гостей', subLabel: 'Через 1 час', time: '20:00', is_occupied: false },
];

// ---- Menu Categories ----
export const MOCK_CATEGORIES = [
    { id: 'cat1', name: 'Пицца', emoji: '🍕' },
    { id: 'cat2', name: 'Паста', emoji: '🍝' },
    { id: 'cat3', name: 'Салаты', emoji: '🥗' },
    { id: 'cat4', name: 'Десерты', emoji: '🍰' },
    { id: 'cat5', name: 'Напитки', emoji: '🥤' },
    { id: 'cat6', name: 'Горячее', emoji: '🥩' },
];

// ---- Menu Dishes ----
export const MOCK_DISHES = [
    // Pizza
    { id: 'd1', name: 'Маргарита', description: 'Томаты, моцарелла, базилик', price: 45000, category: 'cat1', cooking_time: 20, is_available: true, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=60' },
    { id: 'd2', name: 'Пеперони', description: 'Острая колбаса, сыр, чили', price: 55000, category: 'cat1', cooking_time: 15, is_available: true, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&auto=format&fit=crop&q=60' },
    { id: 'd3', name: 'Четыре сыра', description: 'Пармезан, дор блю, чеддер', price: 52000, category: 'cat1', cooking_time: 25, is_available: false, unavailable_reason: 'Нет в наличии', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60' },
    { id: 'd4', name: 'Вегетарианская', description: 'Оливки, грибы, перец, томаты', price: 48000, category: 'cat1', cooking_time: 20, is_available: true, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=60' },
    // Pasta
    { id: 'd5', name: 'Карбонара', description: 'Бекон, пармезан, сливочный соус', price: 42000, category: 'cat2', cooking_time: 15, is_available: true, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&auto=format&fit=crop&q=60' },
    { id: 'd6', name: 'Болоньезе', description: 'Мясной соус, пармезан', price: 40000, category: 'cat2', cooking_time: 20, is_available: true, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&auto=format&fit=crop&q=60' },
    // Salads
    { id: 'd7', name: 'Цезарь', description: 'Куриное филе, сухарики, пармезан', price: 35000, category: 'cat3', cooking_time: 10, is_available: true, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&auto=format&fit=crop&q=60' },
    { id: 'd8', name: 'Греческий', description: 'Огурцы, помидоры, фета, оливки', price: 32000, category: 'cat3', cooking_time: 10, is_available: true, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60' },
    // Desserts
    { id: 'd9', name: 'Тирамису', description: 'Итальянский многослойный десерт', price: 28000, category: 'cat4', cooking_time: 5, is_available: true, image: 'https://images.unsplash.com/photo-1571115177098-24de415b3a4f?w=400&auto=format&fit=crop&q=60' },
    { id: 'd10', name: 'Чизкейк', description: 'Нью-Йорк, с ягодным соусом', price: 30000, category: 'cat4', cooking_time: 5, is_available: true, image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&auto=format&fit=crop&q=60' },
    // Drinks
    { id: 'd11', name: 'Мохито', description: 'Мята, лайм, содовая', price: 22000, category: 'cat5', cooking_time: 5, is_available: true, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&auto=format&fit=crop&q=60' },
    { id: 'd12', name: 'Капучино', description: 'Классический итальянский кофе', price: 18000, category: 'cat5', cooking_time: 5, is_available: true, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=60' },
    // Hot dishes
    { id: 'd13', name: 'Стейк Рибай', description: 'С овощами гриль и соусом', price: 95000, category: 'cat6', cooking_time: 25, is_available: true, image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=400&auto=format&fit=crop&q=60' },
    { id: 'd14', name: 'Лосось на гриле', description: 'С лимонным соусом и овощами', price: 78000, category: 'cat6', cooking_time: 20, is_available: true, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop&q=60' },
];

// ---- Mock Orders ----
export const MOCK_ORDERS = [
    {
        id: 'o1',
        table_number: 4,
        table_id: 't4',
        waiter_name: 'Азиз К.',
        status: 'NEW',
        total_amount: 135000,
        created_at: new Date(Date.now() - 2 * 60000).toISOString(),
        items: [
            { id: 'oi1', dish_name: 'Маргарита', quantity: 2, price: 45000 },
            { id: 'oi2', dish_name: 'Мохито', quantity: 1, price: 22000 },
            { id: 'oi3', dish_name: 'Цезарь', quantity: 1, price: 35000 },
        ],
    },
    {
        id: 'o2',
        table_number: 2,
        table_id: 't2',
        waiter_name: 'Азиз К.',
        status: 'COOKING',
        total_amount: 173000,
        estimated_time: 15,
        created_at: new Date(Date.now() - 12 * 60000).toISOString(),
        items: [
            { id: 'oi4', dish_name: 'Стейк Рибай', quantity: 1, price: 95000 },
            { id: 'oi5', dish_name: 'Лосось на гриле', quantity: 1, price: 78000 },
        ],
    },
    {
        id: 'o3',
        table_number: 9,
        table_id: 't9',
        waiter_name: 'Азиз К.',
        status: 'READY',
        total_amount: 97000,
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
        items: [
            { id: 'oi6', dish_name: 'Пеперони', quantity: 1, price: 55000 },
            { id: 'oi7', dish_name: 'Карбонара', quantity: 1, price: 42000 },
        ],
    },
    {
        id: 'o4',
        table_number: 3,
        table_id: 't3',
        waiter_name: 'Азиз К.',
        status: 'DELIVERED',
        total_amount: 150000,
        created_at: new Date(Date.now() - 45 * 60000).toISOString(),
        items: [
            { id: 'oi8', dish_name: 'Четыре сыра', quantity: 2, price: 52000 },
            { id: 'oi9', dish_name: 'Тирамису', quantity: 1, price: 28000 },
            { id: 'oi10', dish_name: 'Капучино', quantity: 1, price: 18000 },
        ],
    },
];

// ---- Dashboard Stats ----
export const MOCK_DASHBOARD_STATS = {
    tables: { total: 12, available: 5 },
    orders: { active: 3, readyToDeliver: 1 },
    bookings: { today: 8 },
    rating: 4.7,
};

// ---- Recent Actions ----
export const MOCK_RECENT_ACTIONS = [
    { id: 'a1', icon: 'restaurant', text: 'Стол #4 – Заказ принят', time: '2 минуты назад', amount: 135000 },
    { id: 'a2', icon: 'check-circle', text: 'Стол #9 – Заказ готов', time: '10 минут назад', amount: 97000 },
    { id: 'a3', icon: 'delivery-dining', text: 'Стол #3 – Доставлено', time: '20 минут назад', amount: 150000 },
];
