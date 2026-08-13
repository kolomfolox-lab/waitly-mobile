import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable as NativePressable,
  SafeAreaView,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTelegram } from '../../telegram/TelegramProvider';
import Storage from '../../utils/storage';
import api from '../../api/client';

const PAYME_CARD_REF_KEY = 'guest_payme_card_ref';
const USE_NATIVE_DRIVER = Platform.OS !== 'web';
let UI_ACTION_HANDLER = null;

const COLORS = {
  canvas: '#f7f6f3',
  paper: '#fffdfa',
  white: '#ffffff',
  ink: '#211d1a',
  muted: '#77716d',
  faint: '#a7a19c',
  line: '#e8e4df',
  tomato: '#bd3a20',
  coral: '#ff7650',
  coralSoft: '#ffe1d5',
  green: '#1e8a5a',
  greenSoft: '#e1f2e8',
  gold: '#c98b2e',
};

let RESTAURANTS = [
  {
    id: 'bukhara',
    name: 'Bukhara Nights',
    cuisine: 'Узбекская кухня',
    category: 'Национальная кухня',
    rating: '4.9',
    reviews: '128',
    price: '$$$',
    distance: '1.4 км',
    address: 'ул. Амира Темура, 15, Ташкент',
    hours: 'Открыто до 23:00',
    description: 'Современное прочтение традиционной узбекской кухни. Аутентичные рецепты и спокойная атмосфера восточного гостеприимства.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
    dishes: [
      {
        id: 'plov',
        name: 'Праздничный плов',
        nameEn: 'Signature plov',
        nameUz: 'Bayram oshi',
        description: 'Традиционный узбекский плов с бараниной, желтой морковью и нутом',
        descriptionEn: 'Traditional Uzbek plov with lamb, yellow carrot and chickpeas',
        descriptionUz: "Qo'y go'shti, sariq sabzi va no'xatli an'anaviy osh",
        price: 120000,
        image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500&q=85',
      },
      {
        id: 'samsa',
        name: 'Самса тандырная',
        nameEn: 'Tandoor samsa',
        nameUz: 'Tandir somsasi',
        description: 'Сочная самса с рубленой говядиной и луком',
        descriptionEn: 'Juicy pastry with chopped beef and onion',
        descriptionUz: "Maydalangan mol go'shti va piyozli shirali somsa",
        price: 35000,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=85',
      },
      {
        id: 'lagman',
        name: 'Лагман по-бухарски',
        nameEn: 'Bukhara lagman',
        nameUz: "Buxoro lag'moni",
        description: 'Домашняя лапша, овощи и томатный соус',
        descriptionEn: 'Hand-pulled noodles, vegetables and tomato sauce',
        descriptionUz: "Uy lag'moni, sabzavotlar va pomidorli sous",
        price: 68000,
        image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=85',
      },
    ],
  },
  {
    id: 'navoi',
    name: "Choyxona 'Navoiy'",
    cuisine: 'Национальная кухня',
    category: 'Национальная кухня',
    rating: '4.8',
    reviews: '94',
    price: '$$',
    distance: '1.2 км',
    address: 'ул. Навои, 24, Ташкент',
    hours: 'Открыто до 00:00',
    description: 'Теплое место с домашней кухней, чайной церемонией и большим внутренним двориком.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85',
    dishes: [],
  },
  {
    id: 'avenue',
    name: "L'Avenue",
    cuisine: 'Fine Dining',
    category: 'Fine Dining',
    rating: '4.9',
    reviews: '211',
    price: '$$$',
    distance: '3.5 км',
    address: 'пр. Шахрисабз, 8, Ташкент',
    hours: 'Открыто до 01:00',
    description: 'Французская кухня с панорамным видом на вечерний город.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
    dishes: [],
  },
  {
    id: 'morning',
    name: 'Morning Brew',
    cuisine: 'Кафе',
    category: 'Кафе',
    rating: '4.6',
    reviews: '76',
    price: '$',
    distance: '0.8 км',
    address: 'ул. Ойбек, 11, Ташкент',
    hours: 'Открыто до 22:00',
    description: 'Спешелти кофе, свежая выпечка и идеальное место для завтрака.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85',
    dishes: [],
  },
];

const FALLBACK_COVERS = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85',
];

const resolveMediaUrl = (value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const baseUrl = String(api.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${baseUrl}${String(value).startsWith('/') ? value : `/${value}`}`;
};

const normalizeLiveDish = (dish, index) => ({
  id: String(dish.id),
  name: dish.name || dish.title || 'Dish',
  nameEn: dish.name_en || dish.name || dish.title || 'Dish',
  nameUz: dish.name_uz || dish.name || dish.title || 'Taom',
  description: dish.description || dish.ingredients || '',
  descriptionEn: dish.description_en || dish.description || dish.ingredients || '',
  descriptionUz: dish.description_uz || dish.description || dish.ingredients || '',
  price: Number(dish.price || 0),
  image: resolveMediaUrl(dish.image_url || dish.image) || FALLBACK_COVERS[index % FALLBACK_COVERS.length],
  cookingTime: dish.cooking_time,
});

const normalizeLiveRestaurant = (restaurant, index) => ({
  id: String(restaurant.id),
  slug: restaurant.slug,
  name: restaurant.name,
  cuisine: restaurant.review_category || restaurant.category || 'Restaurant',
  category: restaurant.review_category || restaurant.category || 'Restaurant',
  rating: restaurant.average_rating ? Number(restaurant.average_rating).toFixed(1) : '—',
  reviews: String(restaurant.published_reviews_count || 0),
  price: restaurant.average_check_text || '$$',
  distance: restaurant.distance || 'Live data',
  address: restaurant.address || 'Tashkent',
  hours: restaurant.working_hours_text || 'Opening hours on request',
  description: restaurant.review_short_description || 'Restaurant details are loaded from Waitly live data.',
  image: resolveMediaUrl(restaurant.cover_url || restaurant.hero_image_url) || FALLBACK_COVERS[index % FALLBACK_COVERS.length],
  dishes: [],
  isLive: true,
});

const mergeLiveMenu = (restaurant, payload) => {
  const menuDishes = (payload.categories || []).flatMap((category) => category.dishes || []).map(normalizeLiveDish);
  const spotlight = payload.spotlight ? normalizeLiveDish(payload.spotlight, menuDishes.length) : null;
  return {
    ...restaurant,
    name: payload.restaurant?.name || restaurant.name,
    address: payload.restaurant?.address || restaurant.address,
    hours: payload.restaurant?.working_hours_text || restaurant.hours,
    description: payload.restaurant?.review_short_description || restaurant.description,
    image: resolveMediaUrl(payload.restaurant?.hero_image_url || payload.restaurant?.spotlight_image_url) || restaurant.image,
    dishes: menuDishes.length ? menuDishes : spotlight ? [spotlight] : restaurant.dishes,
  };
};

const PAST_BOOKINGS = [
  { name: 'Osh Markazi', date: '15 октября', time: '13:00', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=85' },
  { name: 'The Mixology Lounge', date: '02 октября', time: '21:00', image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=85' },
];

const COPY = {
  ru: {
    greeting: 'Добро пожаловать', find: 'Найдите идеальный столик', search: 'Ресторан, кухня или блюдо...', findButton: 'Найти', categories: 'Категории', recommended: 'Рекомендуем вам', seeAll: 'Все', home: 'Главная', searchTab: 'Поиск', bookings: 'Брони', profile: 'Профиль', national: 'Национальная кухня', cafe: 'Кафе', fineDining: 'Fine Dining', bakery: 'Выпечка', tableQr: 'QR столика', inTelegram: 'Открыто в Telegram', reserve: 'Забронировать стол', backToRestaurant: 'Назад к ресторану', bookingTitle: 'Оформление брони', date: 'Дата', guests: 'Количество гостей', guestWord: 'гостя', lunch: 'ОБЕД', dinner: 'УЖИН', wishes: 'Пожелания к заказу', wishesPlaceholder: 'Например: столик у окна, детский стульчик, аллергия на орехи...', confirmBooking: 'Подтвердить бронь', deposit: 'Гарантийный депозит', depositHint: 'С карты будет списано 1 000 сум для подтверждения брони', paymentTitle: 'Оплата и защита', cardLinkTitle: 'Привяжите карту Payme', cardLinkHint: 'Реквизиты вводятся в защищенном Payme iFrame и не сохраняются в Waitly.', connectPayme: 'Привязать через Payme', paymeWidget: 'Payme secure widget', paymeReady: 'Payme готов к подключению', cardSaved: 'Карта сохранена', useCard: 'Payme •••• 4242', charge: 'Списать 1 000 сум', charging: 'Проверяем оплату...', linking: 'Открываем Payme...', paymentSuccess: 'Бронь подтверждена', paymentSuccessHint: 'Депозит 1 000 сум успешно авторизован', openBooking: 'Открыть бронь', close: 'Закрыть', bookingCreated: 'Моя бронь', upcoming: 'Предстоящие', history: 'История', confirmed: 'Подтверждено', completed: 'Завершено', edit: 'Изменить', route: 'Маршрут', leaveReview: 'Оставить отзыв', profileTitle: 'Мой профиль', premium: 'Premium Member', personal: 'Личные данные', paymentMethods: 'Способы оплаты', promo: 'Промокоды', support: 'Служба поддержки', about: 'О приложении', language: 'Язык', noCard: 'Карта еще не привязана', linkInProfile: 'Подключить для быстрых оплат', logout: 'Выйти', aboutRestaurant: 'О ресторане', popularMenu: 'Популярное в меню', viewAll: 'Смотреть все', address: 'Адрес', hours: 'Время работы', map: 'Показать на карте', noBooking: 'Выберите время, чтобы забронировать столик', tableNumber: 'Стол', tableReady: 'Ваш столик готов', scanHint: 'QR-код связал вас с рестораном', kitchen: 'Кухня', kitchenLoad: 'Загруженность кухни', kitchenEstimate: 'Среднее время приготовления', min: 'мин', orderMenu: 'Открыть меню', callWaiter: 'Позвать официанта', orderStatus: 'Статус заказа', accepted: 'Заказ принят', cooking: 'Готовится', ready: 'Готово', delivered: 'Подано', tableMenu: 'Меню стола', add: 'Добавить', cart: 'Корзина', total: 'Итого', sendOrder: 'Отправить заказ', orderPayment: 'Оплата заказа', orderAccepted: 'Заказ отправлен на кухню', telegramBot: 'Открыть бота в Telegram', demoNote: 'Демо-режим: Payme API подключается после выдачи merchant-доступа.', callWaiterDone: 'Официант уже в пути',
  },
  uz: {
    greeting: 'Xush kelibsiz', find: 'Mukammal stolingizni toping', search: 'Restoran, taom yoki oshxona...', findButton: 'Topish', categories: 'Kategoriyalar', recommended: 'Sizga tavsiya qilamiz', seeAll: 'Barchasi', home: 'Bosh sahifa', searchTab: 'Qidiruv', bookings: 'Bronlar', profile: 'Profil', national: 'Milliy taomlar', cafe: 'Kafe', fineDining: 'Fine Dining', bakery: 'Pishiriqlar', tableQr: 'Stol QR', inTelegram: 'Telegramda ochildi', reserve: 'Stolni bron qilish', backToRestaurant: 'Restoranga qaytish', bookingTitle: 'Bronni rasmiylashtirish', date: 'Sana', guests: 'Mehmonlar soni', guestWord: 'mehmon', lunch: 'TUSHLIK', dinner: 'KECHKI OVQAT', wishes: 'Buyurtma istaklari', wishesPlaceholder: 'Masalan: deraza yonidagi stol, bolalar kreslosi...', confirmBooking: 'Bronni tasdiqlash', deposit: 'Kafolat depoziti', depositHint: "Bronni tasdiqlash uchun kartadan 1 000 so'm yechiladi", paymentTitle: "To'lov va himoya", cardLinkTitle: 'Payme kartasini ulang', cardLinkHint: "Ma'lumotlar xavfsiz Payme iFrame ichida kiritiladi.", connectPayme: 'Payme orqali ulash', paymeWidget: 'Payme secure widget', paymeReady: 'Payme ulanishga tayyor', cardSaved: 'Karta saqlandi', useCard: 'Payme •••• 4242', charge: "1 000 so'm yechish", charging: "To'lov tekshirilmoqda...", linking: 'Payme ochilmoqda...', paymentSuccess: 'Bron tasdiqlandi', paymentSuccessHint: "1 000 so'm depozit muvaffaqiyatli avtorizatsiya qilindi", openBooking: 'Bronni ochish', close: 'Yopish', bookingCreated: 'Mening bronim', upcoming: 'Yaqinlashayotgan', history: 'Tarix', confirmed: 'Tasdiqlangan', completed: 'Yakunlangan', edit: "O'zgartirish", route: "Yo'nalish", leaveReview: 'Fikr qoldirish', profileTitle: 'Mening profilim', premium: 'Premium Member', personal: "Shaxsiy ma'lumotlar", paymentMethods: "To'lov usullari", promo: 'Promokodlar', support: "Qo'llab-quvvatlash", about: 'Ilova haqida', language: 'Til', noCard: 'Karta hali ulanmagan', linkInProfile: "Tezkor to'lovlar uchun ulang", logout: 'Chiqish', aboutRestaurant: 'Restoran haqida', popularMenu: 'Menyuda mashhur', viewAll: "Barchasini ko'rish", address: 'Manzil', hours: 'Ish vaqti', map: "Xaritada ko'rsatish", noBooking: 'Stol bron qilish uchun vaqtni tanlang', tableNumber: 'Stol', tableReady: 'Stolingiz tayyor', scanHint: "QR kod sizni restoran bilan bog'ladi", kitchen: 'Oshxona', kitchenLoad: 'Oshxona bandligi', kitchenEstimate: "O'rtacha tayyorlash vaqti", min: 'daq', orderMenu: 'Menyuni ochish', callWaiter: 'Ofitsiantni chaqirish', orderStatus: 'Buyurtma holati', accepted: 'Buyurtma qabul qilindi', cooking: 'Tayyorlanmoqda', ready: 'Tayyor', delivered: 'Tortildi', tableMenu: 'Stol menyusi', add: "Qo'shish", cart: 'Savat', total: 'Jami', sendOrder: 'Buyurtma yuborish', orderPayment: "Buyurtma to'lovi", orderAccepted: 'Buyurtma oshxonaga yuborildi', telegramBot: 'Telegram botni ochish', demoNote: "Demo rejim: Payme API merchant ruxsatidan so'ng ulanadi.", callWaiterDone: "Ofitsiant yo'lda",
  },
  en: {
    greeting: 'Welcome back', find: 'Find your perfect table', search: 'Restaurant, cuisine or dish...', findButton: 'Search', categories: 'Categories', recommended: 'Recommended for you', seeAll: 'See all', home: 'Home', searchTab: 'Search', bookings: 'Bookings', profile: 'Profile', national: 'Local cuisine', cafe: 'Cafe', fineDining: 'Fine Dining', bakery: 'Bakery', tableQr: 'Table QR', inTelegram: 'Opened in Telegram', reserve: 'Reserve a table', backToRestaurant: 'Back to restaurant', bookingTitle: 'Complete your booking', date: 'Date', guests: 'Number of guests', guestWord: 'guests', lunch: 'LUNCH', dinner: 'DINNER', wishes: 'Special requests', wishesPlaceholder: 'Window seat, high chair, nut allergy...', confirmBooking: 'Confirm booking', deposit: 'Reservation deposit', depositHint: '1,000 UZS will be charged to confirm your reservation', paymentTitle: 'Payment & protection', cardLinkTitle: 'Link your Payme card', cardLinkHint: 'Card details are entered in the secure Payme iFrame and never touch Waitly.', connectPayme: 'Link with Payme', paymeWidget: 'Payme secure widget', paymeReady: 'Payme is ready to connect', cardSaved: 'Card saved', useCard: 'Payme •••• 4242', charge: 'Charge 1,000 UZS', charging: 'Verifying payment...', linking: 'Opening Payme...', paymentSuccess: 'Booking confirmed', paymentSuccessHint: 'The 1,000 UZS deposit was authorized successfully', openBooking: 'Open booking', close: 'Close', bookingCreated: 'My booking', upcoming: 'Upcoming', history: 'Past visits', confirmed: 'Confirmed', completed: 'Completed', edit: 'Edit', route: 'Directions', leaveReview: 'Leave a review', profileTitle: 'My profile', premium: 'Premium Member', personal: 'Personal details', paymentMethods: 'Payment methods', promo: 'Promo codes', support: 'Support', about: 'About Waitly', language: 'Language', noCard: 'No card linked yet', linkInProfile: 'Connect for faster checkout', logout: 'Log out', aboutRestaurant: 'About the restaurant', popularMenu: 'Popular on the menu', viewAll: 'View all', address: 'Address', hours: 'Opening hours', map: 'Show on map', noBooking: 'Choose a time to reserve your table', tableNumber: 'Table', tableReady: 'Your table is ready', scanHint: 'The QR code connected you to this restaurant', kitchen: 'Kitchen', kitchenLoad: 'Kitchen load', kitchenEstimate: 'Average preparation time', min: 'min', orderMenu: 'Open menu', callWaiter: 'Call a waiter', orderStatus: 'Order status', accepted: 'Order accepted', cooking: 'Cooking', ready: 'Ready', delivered: 'Served', tableMenu: 'Table menu', add: 'Add', cart: 'Cart', total: 'Total', sendOrder: 'Send order', orderPayment: 'Order payment', orderAccepted: 'Your order is with the kitchen', telegramBot: 'Open Telegram bot', demoNote: 'Demo mode: Payme API will be connected after merchant access is issued.', callWaiterDone: 'A waiter is on the way',
  },
};

Object.assign(COPY.ru, {
  settingsSaved: 'Настройки сохранены',
  personalHint: 'Данные профиля подтверждены Telegram.',
  promoPlaceholder: 'Введите промокод',
  applyPromo: 'Применить промокод',
  supportTelegram: 'Написать в Telegram',
  supportPhone: 'Позвонить в поддержку',
  supportHint: 'Ответим в рабочее время.',
  aboutText: 'Waitly помогает найти столик, заказать блюда и закрыть счет без ожидания.',
  actionDone: 'Готово',
  member: 'Telegram member',
  verifiedMember: 'Verified member',
  telegramRegisterTitle: 'Регистрация через Telegram',
  telegramRegisterHint: 'Подтвердите номер из Telegram, чтобы создать защищенный профиль Waitly.',
  telegramPhonePlaceholder: '+998 90 123-45-67',
  shareTelegramPhone: 'Передать номер Telegram',
  completeRegistration: 'Завершить регистрацию',
  registrationPending: 'Проверяем Telegram...',
  cardVerificationHint: 'После привязки карты профиль станет Verified member.',
  payAtEnd: 'Оплата в конце визита',
  finalBill: 'Финальный счет',
  payFinalBill: 'Оплатить счет',
  billPaid: 'Счет оплачен',
  billPaidHint: 'Спасибо, счет закрыт одной оплатой',
});
Object.assign(COPY.uz, {
  settingsSaved: 'Sozlamalar saqlandi',
  personalHint: 'Profil ma’lumotlari Telegram orqali tasdiqlangan.',
  promoPlaceholder: 'Promokodni kiriting',
  applyPromo: 'Promokodni qo‘llash',
  supportTelegram: 'Telegramda yozish',
  supportPhone: 'Yordamga qo‘ng‘iroq qilish',
  supportHint: 'Ish vaqtida javob beramiz.',
  aboutText: 'Waitly stol topish, taom buyurtma qilish va hisobni kutmasdan yopishga yordam beradi.',
  actionDone: 'Tayyor',
  member: 'Telegram a’zosi',
  verifiedMember: 'Verified member',
  telegramRegisterTitle: "Telegram orqali ro'yxatdan o'tish",
  telegramRegisterHint: "Waitly profilini yaratish uchun Telegram raqamingizni tasdiqlang.",
  telegramPhonePlaceholder: '+998 90 123-45-67',
  shareTelegramPhone: 'Telegram raqamini yuborish',
  completeRegistration: "Ro'yxatdan o'tishni yakunlash",
  registrationPending: 'Telegram tekshirilmoqda...',
  cardVerificationHint: 'Karta ulangandan so‘ng profilingiz Verified member bo‘ladi.',
  payAtEnd: "Tashrif oxirida to'lash",
  finalBill: 'Yakuniy hisob',
  payFinalBill: "Hisobni to'lash",
  billPaid: "Hisob to'landi",
  billPaidHint: 'Rahmat, hisob bir to‘lov bilan yopildi',
});
Object.assign(COPY.en, {
  settingsSaved: 'Settings saved',
  personalHint: 'Your profile details are verified by Telegram.',
  promoPlaceholder: 'Enter promo code',
  applyPromo: 'Apply promo code',
  supportTelegram: 'Message on Telegram',
  supportPhone: 'Call support',
  supportHint: 'We reply during working hours.',
  aboutText: 'Waitly helps you find a table, order dishes and close the bill without waiting.',
  actionDone: 'Done',
  member: 'Telegram member',
  verifiedMember: 'Verified member',
  telegramRegisterTitle: 'Register with Telegram',
  telegramRegisterHint: 'Confirm your Telegram phone number to create a protected Waitly profile.',
  telegramPhonePlaceholder: '+998 90 123-45-67',
  shareTelegramPhone: 'Share Telegram phone',
  completeRegistration: 'Complete registration',
  registrationPending: 'Checking Telegram...',
  cardVerificationHint: 'Link a card to become a Verified member.',
  payAtEnd: 'Pay at the end of your visit',
  finalBill: 'Final bill',
  payFinalBill: 'Pay final bill',
  billPaid: 'Bill paid',
  billPaidHint: 'Thank you, your bill was closed in one payment',
});

const formatMoney = (amount, locale) => `${Number(amount).toLocaleString('ru-RU')} ${locale === 'en' ? 'UZS' : locale === 'uz' ? "so'm" : 'сум'}`;

function Icon({ name, size = 20, color = COLORS.ink }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

function findPressableText(node) {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(findPressableText).filter(Boolean).join(' ');
  if (node?.props?.children) return findPressableText(node.props.children);
  return '';
}

function findPressableIcon(node) {
  if (Array.isArray(node)) {
    for (const child of node) {
      const icon = findPressableIcon(child);
      if (icon) return icon;
    }
  }
  if (node?.props?.name) return node.props.name;
  if (node?.props?.children) return findPressableIcon(node.props.children);
  return '';
}

function Pressable({ onPress, children, ...props }) {
  const fallback = () => UI_ACTION_HANDLER?.({
    text: findPressableText(children),
    icon: findPressableIcon(children),
  });
  return <NativePressable {...props} onPress={onPress || fallback}>{children}</NativePressable>;
}

function Brand() {
  return <Text style={styles.brand}>Waitly</Text>;
}

function TopBar({ onBack, onProfile, right, title }) {
  return <View style={styles.topBar}>{onBack ? <Pressable onPress={onBack} style={styles.iconButton} hitSlop={10}><Icon name="arrow-back" size={23} color={COLORS.tomato} /></Pressable> : <View style={styles.topBarSpacer} />}{title ? <Text style={styles.topBarTitle}>{title}</Text> : <Brand />}{right || <Pressable onPress={onProfile} style={styles.avatarButton} hitSlop={8}><Icon name="person-outline" size={19} color={COLORS.tomato} /></Pressable>}</View>;
}

function SectionTitle({ title, action, onAction }) {
  return <View style={styles.sectionTitleRow}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}</View>;
}

function BottomNav({ active, copy, onNavigate }) {
  const tabs = [{ id: 'home', label: copy.home, icon: 'home-filled' }, { id: 'search', label: copy.searchTab, icon: 'search' }, { id: 'bookings', label: copy.bookings, icon: 'event-note' }, { id: 'profile', label: copy.profile, icon: 'person-outline' }];
  return <View style={styles.bottomNav}>{tabs.map((tab) => <Pressable key={tab.id} onPress={() => onNavigate(tab.id)} style={styles.bottomItem}><View style={[styles.bottomIcon, active === tab.id && styles.bottomIconActive]}><Icon name={tab.icon} size={20} color={active === tab.id ? COLORS.tomato : COLORS.muted} /></View><Text style={[styles.bottomLabel, active === tab.id && styles.bottomLabelActive]}>{tab.label}</Text></Pressable>)}</View>;
}

function RestaurantCard({ restaurant, copy, onPress }) {
  return <Pressable onPress={onPress} style={styles.restaurantCard}><View style={styles.restaurantImageWrap}><Image source={{ uri: restaurant.image }} style={styles.restaurantImage} /><View style={styles.ratingBadge}><Icon name="star" size={13} color={COLORS.tomato} /><Text style={styles.ratingText}>{restaurant.rating}</Text></View></View><View style={styles.restaurantCardBody}><View style={styles.restaurantNameLine}><Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text><Text style={styles.priceText}>{restaurant.price}</Text></View><Text style={styles.restaurantDescription} numberOfLines={2}>{restaurant.description}</Text><View style={styles.metaRow}><Text style={styles.metaPill}>{restaurant.category === 'Кафе' ? copy.cafe : restaurant.category}</Text><Text style={styles.metaPill}>{restaurant.distance}</Text></View></View></Pressable>;
}

function HomeScreen({ copy, userName, query, setQuery, onSearch, onRestaurant, onTable, onProfile, onBookings }) {
  const categories = [{ label: copy.national, icon: 'restaurant' }, { label: copy.cafe, icon: 'coffee' }, { label: copy.fineDining, icon: 'wine-bar' }, { label: copy.bakery, icon: 'bakery-dining' }];
  const filtered = RESTAURANTS.filter((restaurant) => !query.trim() || `${restaurant.name} ${restaurant.cuisine} ${restaurant.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.homeContent}><TopBar onProfile={onProfile} right={<View style={styles.topActions}><Pressable onPress={onTable} style={styles.qrButton}><Icon name="qr-code-2" size={17} color={COLORS.tomato} /><Text style={styles.qrButtonText}>{copy.tableQr}</Text></Pressable><Pressable onPress={onProfile} style={styles.avatarButton}><Icon name="person-outline" size={19} color={COLORS.tomato} /></Pressable></View>} /><Text style={styles.eyebrow}>{copy.greeting}, {userName}</Text><Text style={styles.homeTitle}>{copy.find}</Text><View style={styles.searchBox}><Icon name="search" size={22} color={COLORS.muted} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={onSearch} placeholder={copy.search} placeholderTextColor={COLORS.faint} style={styles.searchInput} returnKeyType="search" /><Pressable onPress={onSearch} style={styles.searchAction}><Text style={styles.searchActionText}>{copy.findButton}</Text></Pressable></View><SectionTitle title={copy.categories} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>{categories.map((category, index) => <Pressable key={category.label} style={[styles.categoryChip, index === 0 && styles.categoryChipActive]}><Icon name={category.icon} size={16} color={index === 0 ? COLORS.white : COLORS.ink} /><Text style={[styles.categoryChipText, index === 0 && styles.categoryChipTextActive]}>{category.label}</Text></Pressable>)}</ScrollView><View style={styles.tableBanner}><View style={styles.tableBannerIcon}><Icon name="qr-code-2" size={24} color={COLORS.tomato} /></View><View style={styles.tableBannerCopy}><Text style={styles.tableBannerTitle}>{copy.inTelegram}</Text><Text style={styles.tableBannerSubtitle}>{copy.scanHint}</Text></View><Pressable onPress={onTable} style={styles.tableBannerButton}><Icon name="arrow-forward" size={18} color={COLORS.white} /></Pressable></View><SectionTitle title={copy.recommended} action={copy.seeAll} onAction={onSearch} />{filtered.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} copy={copy} onPress={() => onRestaurant(restaurant)} />)}</ScrollView><BottomNav active="home" copy={copy} onNavigate={(id) => id === 'bookings' ? onBookings() : id === 'profile' ? onProfile() : onSearch()} /></View>;
}

function DetailScreen({ restaurant, copy, favorite, onFavorite, onBack, onReserve, onMenu }) {
  const dishes = restaurant.dishes?.length ? restaurant.dishes : RESTAURANTS[0].dishes;
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}><View style={styles.detailHero}><Image source={{ uri: restaurant.image }} style={styles.detailHeroImage} /><View style={styles.heroScrim} /><View style={styles.detailHeroActions}><Pressable onPress={onBack} style={styles.heroCircle}><Icon name="arrow-back" size={22} color={COLORS.ink} /></Pressable><View style={styles.heroActionGroup}><Pressable onPress={onFavorite} style={styles.heroCircle}><Icon name={favorite ? 'favorite' : 'favorite-border'} size={22} color={favorite ? COLORS.tomato : COLORS.ink} /></Pressable><Pressable style={styles.heroCircle}><Icon name="share" size={21} color={COLORS.ink} /></Pressable></View></View><View style={styles.heroCopy}><View style={styles.tagRow}><Text style={styles.heroTag}>{restaurant.cuisine}</Text><Text style={styles.heroTag}>{restaurant.price}</Text></View><Text style={styles.detailTitle}>{restaurant.name}</Text><View style={styles.detailRating}><Icon name="star-border" size={22} color="#ffaf4e" /><Text style={styles.detailRatingText}>{restaurant.rating}</Text><Text style={styles.detailReviews}>({restaurant.reviews} отзывов)</Text></View></View></View><View style={styles.infoGrid}><View style={styles.infoCell}><View style={styles.infoIcon}><Icon name="location-on" size={22} color={COLORS.tomato} /></View><View style={styles.infoCopy}><Text style={styles.infoLabel}>{copy.address}</Text><Text style={styles.infoValue}>{restaurant.address}</Text><Text style={styles.infoLink}>{copy.map}</Text></View></View><View style={styles.infoCell}><View style={styles.infoIcon}><Icon name="schedule" size={22} color={COLORS.tomato} /></View><View style={styles.infoCopy}><Text style={styles.infoLabel}>{copy.hours}</Text><Text style={styles.infoValue}>{restaurant.hours}</Text><Text style={styles.infoLink}>{copy.seeAll}</Text></View></View></View><View style={styles.detailSection}><Text style={styles.detailSectionTitle}>{copy.aboutRestaurant}</Text><Text style={styles.aboutText}>{restaurant.description} Погрузитесь в атмосферу восточного гостеприимства, где каждая деталь продумана для вашего комфорта.</Text></View><View style={styles.detailSection}><SectionTitle title={copy.popularMenu} action={copy.viewAll} onAction={onMenu} />{dishes.slice(0, 2).map((dish) => <Pressable key={dish.id} onPress={onMenu} style={styles.menuPreviewCard}><Image source={{ uri: dish.image }} style={styles.menuPreviewImage} /><View style={styles.menuPreviewCopy}><Text style={styles.menuPreviewName}>{dish.name}</Text><Text style={styles.menuPreviewDescription} numberOfLines={2}>{dish.description}</Text><Text style={styles.menuPreviewPrice}>{formatMoney(dish.price, 'ru')}</Text></View><Icon name="chevron-right" size={22} color={COLORS.faint} /></Pressable>)}</View></ScrollView><View style={styles.stickyFooter}><Pressable onPress={onReserve} style={styles.primaryButton}><Icon name="event-available" size={21} color={COLORS.white} /><Text style={styles.primaryButtonText}>{copy.reserve}</Text></Pressable></View></View>;
}

function DatePicker({ selectedDate, onChange, locale }) {
  const days = locale === 'en' ? ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : locale === 'uz' ? ['Chor', 'Pay', 'Jum', 'Shan', 'Yak'] : ['Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>{['15', '16', '17', '18', '19'].map((date, index) => <Pressable key={date} onPress={() => onChange(date)} style={[styles.dateCard, selectedDate === date && styles.dateCardActive]}><Text style={[styles.dateWeekday, selectedDate === date && styles.dateWeekdayActive]}>{days[index]}</Text><Text style={[styles.dateNumber, selectedDate === date && styles.dateNumberActive]}>{date}</Text></Pressable>)}</ScrollView>;
}

function BookingScreen({ restaurant, copy, locale, selectedDate, setSelectedDate, guests, setGuests, selectedTime, setSelectedTime, notes, setNotes, onBack, onConfirm }) {
  const renderTimes = (items) => <View style={styles.timeGrid}>{items.map((time) => <Pressable key={time} onPress={() => setSelectedTime(time)} style={[styles.timeChip, selectedTime === time && styles.timeChipActive]}><Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>{time}</Text></Pressable>)}</View>;
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bookingContent}><TopBar onBack={onBack} title={copy.bookingTitle} right={<View style={styles.languageBadge}><Text style={styles.languageBadgeText}>{locale.toUpperCase()}</Text></View>} /><Text style={styles.bookingRestaurant}>{restaurant.name}</Text><Text style={styles.bookingSubtitle}>{copy.noBooking}</Text><Text style={styles.formSectionTitle}>{copy.date}</Text><DatePicker selectedDate={selectedDate} onChange={setSelectedDate} locale={locale} /><View style={styles.guestHeader}><Text style={styles.formSectionTitle}>{copy.guests}</Text><Text style={styles.guestValue}>{guests} {copy.guestWord}</Text></View><View style={styles.guestControl}><Pressable onPress={() => setGuests(Math.max(1, guests - 1))} style={styles.guestControlButton}><Icon name="remove" size={21} color={COLORS.ink} /></Pressable><Text style={styles.guestCount}>{guests}</Text><Pressable onPress={() => setGuests(Math.min(12, guests + 1))} style={styles.guestControlButton}><Icon name="add" size={21} color={COLORS.coral} /></Pressable></View><Text style={styles.formSectionTitle}>{copy.lunch}</Text>{renderTimes(['12:00', '12:30', '13:00', '13:30', '14:00'])}<Text style={[styles.formSectionTitle, styles.dinnerTitle]}>{copy.dinner}</Text>{renderTimes(['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'])}<Text style={[styles.formSectionTitle, styles.wishesTitle]}>{copy.wishes}</Text><TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder={copy.wishesPlaceholder} placeholderTextColor={COLORS.faint} style={styles.notesInput} /></ScrollView><View style={styles.bookingFooter}><View style={styles.footerCopy}><Text style={styles.footerSummary}>{selectedDate} мая, {selectedTime}, {guests} {copy.guestWord}</Text><Text style={styles.footerRestaurant}>{restaurant.name}</Text></View><Pressable onPress={onConfirm} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{copy.confirmBooking}</Text><Icon name="arrow-forward" size={20} color={COLORS.white} /></Pressable></View></View>;
}

function BookingCard({ booking, copy, onEdit }) {
  return <View style={styles.bookingCard}><View style={styles.bookingCardImageWrap}><Image source={{ uri: booking.image }} style={styles.bookingCardImage} /><View style={styles.confirmedBadge}><View style={styles.greenDot} /><Text style={styles.confirmedBadgeText}>{copy.confirmed}</Text></View></View><View style={styles.bookingCardBody}><View style={styles.bookingCardTitleRow}><Text style={styles.bookingCardTitle}>{booking.name}</Text><Text style={styles.bookingCardPrice}>{booking.price || '$$'}</Text></View><View style={styles.bookingInfoRow}><Icon name="event" size={18} color={COLORS.muted} /><Text style={styles.bookingInfoText}>{booking.date}</Text></View><View style={styles.bookingInfoRow}><Icon name="schedule" size={18} color={COLORS.muted} /><Text style={styles.bookingInfoText}>{booking.time}</Text></View><View style={styles.bookingInfoRow}><Icon name="people-outline" size={18} color={COLORS.muted} /><Text style={styles.bookingInfoText}>{booking.guests || 2} {copy.guestWord}</Text></View><View style={styles.bookingActions}><Pressable onPress={onEdit} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{copy.edit}</Text></Pressable><Pressable style={styles.coralAction}><Text style={styles.coralActionText}>{copy.route}</Text></Pressable></View></View></View>;
}

function BookingsScreen({ copy, booking, onEdit, onHome, onSearch, onProfile }) {
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bookingsContent}><TopBar onProfile={onProfile} /><Text style={styles.pageTitle}>{copy.bookingCreated}</Text><Text style={styles.pageSubtitle}>{copy.upcoming}</Text>{booking ? <BookingCard booking={booking} copy={copy} onEdit={onEdit} /> : null}<Text style={styles.pageSubtitle}>{copy.history}</Text>{PAST_BOOKINGS.map((past) => <View key={past.name} style={styles.pastCard}><Image source={{ uri: past.image }} style={styles.pastImage} /><View style={styles.pastCopy}><View style={styles.pastStatus}><Icon name="check-circle-outline" size={14} color={COLORS.muted} /><Text style={styles.pastStatusText}>{copy.completed}</Text></View><Text style={styles.pastName}>{past.name}</Text><Text style={styles.pastInfo}>{past.date} · {past.time}</Text><Pressable style={styles.pastButton}><Icon name="star-border" size={16} color={COLORS.ink} /><Text style={styles.pastButtonText}>{copy.leaveReview}</Text></Pressable></View></View>)}</ScrollView><BottomNav active="bookings" copy={copy} onNavigate={(id) => id === 'home' ? onHome() : id === 'search' ? onSearch() : id === 'profile' ? onProfile() : undefined} /></View>;
}

function ProfileScreen({ copy, locale, savedCard, onLanguage, onHome, onSearch, onBookings, onLinkCard, onSettings }) {
  const rows = [{ icon: 'person-outline', text: copy.personal, action: () => onSettings('personal') }, { icon: 'credit-card', text: copy.paymentMethods, action: onLinkCard }, { icon: 'sell', text: copy.promo, action: () => onSettings('promo') }, { icon: 'support-agent', text: copy.support, action: () => onSettings('support') }, { icon: 'info-outline', text: copy.about, action: () => onSettings('about') }];
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.profileContent}><TopBar onProfile={() => {}} /><View style={styles.profileHero}><View style={styles.profileAvatar}><Text style={styles.profileInitials}>МС</Text></View><Pressable style={styles.profileEdit}><Icon name="edit" size={16} color={COLORS.white} /></Pressable><Text style={styles.profileName}>Малика Саидова</Text><Text style={styles.profilePhone}>+998 90 123-45-67</Text><View style={styles.premiumBadge}><Icon name="star-border" size={18} color={COLORS.tomato} /><Text style={styles.premiumText}>{copy.premium}</Text></View></View><Pressable onPress={onLinkCard} style={styles.savedCardPanel}><View style={styles.savedCardIcon}><Icon name="credit-card" size={23} color={COLORS.tomato} /></View><View style={styles.savedCardCopy}><Text style={styles.savedCardTitle}>{savedCard ? copy.cardSaved : copy.noCard}</Text><Text style={styles.savedCardHint}>{savedCard ? copy.useCard : copy.linkInProfile}</Text></View><Icon name="chevron-right" size={23} color={COLORS.muted} /></Pressable><View style={styles.profileMenu}>{rows.map((row) => <Pressable key={row.text} onPress={row.action} style={styles.profileRow}><View style={styles.profileRowIcon}><Icon name={row.icon} size={22} color={COLORS.tomato} /></View><Text style={styles.profileRowText}>{row.text}</Text><Icon name="chevron-right" size={24} color={COLORS.muted} /></Pressable>)}</View><Pressable onPress={onLanguage} style={styles.languageRow}><View style={styles.profileRowIcon}><Icon name="language" size={22} color={COLORS.tomato} /></View><Text style={styles.profileRowText}>{copy.language}</Text><View style={styles.currentLanguage}><Text style={styles.currentLanguageText}>{locale.toUpperCase()}</Text></View><Icon name="chevron-right" size={24} color={COLORS.muted} /></Pressable><Pressable style={styles.logoutButton}><Icon name="logout" size={21} color={COLORS.tomato} /><Text style={styles.logoutText}>{copy.logout}</Text></Pressable></ScrollView><BottomNav active="profile" copy={copy} onNavigate={(id) => id === 'home' ? onHome() : id === 'search' ? onSearch() : id === 'bookings' ? onBookings() : undefined} /></View>;
}

function TableScreen({ copy, tableNumber, kitchenStep, order, onMenu, onHome, onSearch, onBookings, onCallWaiter, onProfile, onAdvanceKitchen, onOpenBot }) {
  const status = kitchenStep >= 3 ? copy.ready : kitchenStep >= 2 ? copy.cooking : copy.accepted;
  const steps = [copy.accepted, copy.cooking, copy.ready, copy.delivered];
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tableContent}><TopBar onBack={onHome} title="Waitly" right={<Pressable onPress={onProfile} style={styles.avatarButton}><Icon name="person-outline" size={19} color={COLORS.tomato} /></Pressable>} /><View style={styles.telegramPill}><Icon name="send" size={15} color="#2b94cf" /><Text style={styles.telegramPillText}>{copy.inTelegram}</Text></View><View style={styles.tableHero}><View style={styles.tableHeroIcon}><Icon name="table-restaurant" size={29} color={COLORS.tomato} /></View><Text style={styles.tableHeroKicker}>{copy.tableReady}</Text><Text style={styles.tableHeroNumber}>{copy.tableNumber} {tableNumber}</Text><Text style={styles.tableHeroHint}>{copy.scanHint}</Text></View><View style={styles.restaurantMini}><Image source={{ uri: RESTAURANTS[0].image }} style={styles.restaurantMiniImage} /><View style={styles.restaurantMiniCopy}><Text style={styles.restaurantMiniName}>{RESTAURANTS[0].name}</Text><Text style={styles.restaurantMiniAddress}>{RESTAURANTS[0].address}</Text></View><Icon name="verified" size={21} color={COLORS.green} /></View><View style={styles.kitchenCard}><View style={styles.kitchenHeader}><View><Text style={styles.kitchenLabel}>{copy.kitchen}</Text><Text style={styles.kitchenTitle}>{copy.kitchenLoad}</Text></View><View style={styles.loadBadge}><View style={styles.greenDot} /><Text style={styles.loadBadgeText}>42%</Text></View></View><View style={styles.loadTrack}><View style={styles.loadFill} /></View><View style={styles.kitchenFooter}><Text style={styles.kitchenEstimate}>{copy.kitchenEstimate}</Text><Text style={styles.kitchenMinutes}>12 {copy.min}</Text></View></View>{order ? <View style={styles.orderStatusCard}><View style={styles.orderStatusHeader}><Text style={styles.orderStatusTitle}>{copy.orderStatus}</Text><Text style={styles.orderStatusNumber}>#{order.id}</Text></View><Text style={styles.orderStatusMain}>{status}</Text><View style={styles.orderTimeline}>{steps.map((label, index) => <View key={label} style={styles.orderStep}><View style={[styles.orderStepDot, index <= kitchenStep && styles.orderStepDotActive]}>{index < kitchenStep ? <Icon name="check" size={12} color={COLORS.white} /> : null}</View>{index < 3 ? <View style={[styles.orderStepLine, index < kitchenStep && styles.orderStepLineActive]} /> : null}<Text style={styles.orderStepText}>{label}</Text></View>)}</View><Pressable onPress={onAdvanceKitchen} style={styles.refreshStatus}><Icon name="refresh" size={17} color={COLORS.tomato} /><Text style={styles.refreshStatusText}>{copy.orderStatus}</Text></Pressable></View> : null}<View style={styles.tableActions}><Pressable onPress={onMenu} style={styles.primaryButton}><Icon name="restaurant-menu" size={21} color={COLORS.white} /><Text style={styles.primaryButtonText}>{copy.orderMenu}</Text></Pressable><Pressable onPress={onCallWaiter} style={styles.outlineButton}><Icon name="notifications-none" size={21} color={COLORS.tomato} /><Text style={styles.outlineButtonText}>{copy.callWaiter}</Text></Pressable><Pressable onPress={onOpenBot} style={styles.botButton}><Icon name="send" size={18} color={COLORS.tomato} /><Text style={styles.botButtonText}>{copy.telegramBot}</Text></Pressable></View></ScrollView><BottomNav active="home" copy={copy} onNavigate={(id) => id === 'home' ? onHome() : id === 'search' ? onSearch() : id === 'bookings' ? onBookings() : id === 'profile' ? onProfile() : undefined} /></View>;
}

function AnimatedDishCard({ dish, index, locale, copy, quantity, onAdd, onRemove }) {
  const scale = useRef(new Animated.Value(1)).current;
  const displayName = locale === 'en' ? dish.nameEn || dish.name : locale === 'uz' ? dish.nameUz || dish.name : dish.name;
  const displayDescription = locale === 'en' ? dish.descriptionEn || dish.description : locale === 'uz' ? dish.descriptionUz || dish.description : dish.description;

  useEffect(() => {
    if (!quantity) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.035, friction: 5, tension: 190, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 170, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [quantity, scale]);

  return <Animated.View style={[styles.menuDishCard, { transform: [{ scale }] }]}><Image source={{ uri: dish.image }} style={styles.menuDishImage} /><View style={styles.menuDishOverlay} /><View style={styles.menuDishCopy}><Text style={styles.menuDishName}>{displayName}</Text><Text style={styles.menuDishDescription}>{displayDescription}</Text><Text style={styles.menuDishPrice}>{formatMoney(dish.price, locale)}</Text></View>{quantity > 0 ? <View style={styles.menuQuantityControl}><Pressable onPress={() => onRemove(dish.id)} style={styles.menuQuantityButton}><Icon name="remove" size={17} color={COLORS.white} /></Pressable><Text style={styles.menuQuantityText}>{quantity}</Text><Pressable onPress={() => onAdd(dish)} style={styles.menuQuantityButton}><Icon name="add" size={17} color={COLORS.white} /></Pressable></View> : <Pressable onPress={() => onAdd(dish)} style={styles.menuAddButton}><Icon name="add" size={20} color={COLORS.white} /><Text style={styles.menuAddText}>{copy.add}</Text></Pressable>}{index === 0 ? <View style={styles.menuPopularTag}><Icon name="star" size={12} color={COLORS.tomato} /><Text style={styles.menuPopularText}>{copy.recommended}</Text></View> : null}</Animated.View>;
}

function AnimatedMenuScreen({ restaurant, copy, locale, cart, onBack, onAdd, onRemove, onCart, tableNumber }) {
  const cartScale = useRef(new Animated.Value(1)).current;
  const dishes = restaurant?.dishes?.length ? restaurant.dishes : RESTAURANTS[0].dishes;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!cartCount) return;
    Animated.sequence([
      Animated.spring(cartScale, { toValue: 1.06, friction: 5, tension: 180, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.spring(cartScale, { toValue: 1, friction: 6, tension: 160, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [cartCount, cartScale]);

  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuContent}><TopBar onBack={onBack} title={restaurant?.name || RESTAURANTS[0].name} right={<View style={styles.tablePill}><Icon name="table-restaurant" size={15} color={COLORS.tomato} /><Text style={styles.tablePillText}>{copy.tableNumber} {tableNumber}</Text></View>} /><Text style={styles.menuKicker}>{restaurant?.category || 'FINE DINING'} · LIVE MENU</Text><Text style={styles.menuHeading}>{copy.tableMenu}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuTabs}><Text style={styles.menuTabActive}>{copy.national}</Text><Text style={styles.menuTab}>{copy.lunch}</Text><Text style={styles.menuTab}>{copy.dinner}</Text><Text style={styles.menuTab}>{copy.bakery}</Text></ScrollView>{dishes.map((dish, index) => <AnimatedDishCard key={dish.id} dish={dish} index={index} locale={locale} copy={copy} quantity={cart.find((item) => item.id === dish.id)?.quantity || 0} onAdd={onAdd} onRemove={onRemove} />)}</ScrollView>{cartCount > 0 ? <Animated.View style={[styles.cartFloat, { transform: [{ scale: cartScale }] }]}><Pressable onPress={onCart} style={styles.cartFloatPressable}><View style={styles.cartFloatCount}><Text style={styles.cartFloatCountText}>{cartCount}</Text></View><Text style={styles.cartFloatText}>{copy.cart}</Text><Text style={styles.cartFloatTotal}>{formatMoney(cartTotal, locale)}</Text><Icon name="arrow-forward" size={19} color={COLORS.white} /></Pressable></Animated.View> : null}</View>;
}

function MenuScreen({ restaurant, copy, locale, cart, onBack, onAdd, onRemove, onCart, tableNumber }) {
  return <AnimatedMenuScreen restaurant={restaurant} copy={copy} locale={locale} cart={cart} onBack={onBack} onAdd={onAdd} onRemove={onRemove} onCart={onCart} tableNumber={tableNumber} />;
  /*
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuContent}><TopBar onBack={onBack} title={RESTAURANTS[0].name} right={<View style={styles.tablePill}><Icon name="table-restaurant" size={15} color={COLORS.tomato} /><Text style={styles.tablePillText}>{copy.tableNumber} {tableNumber}</Text></View>} /><Text style={styles.menuKicker}>FINE DINING · TASHKENT</Text><Text style={styles.menuHeading}>{copy.tableMenu}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuTabs}><Text style={styles.menuTabActive}>{copy.national}</Text><Text style={styles.menuTab}>{copy.lunch}</Text><Text style={styles.menuTab}>{copy.dinner}</Text><Text style={styles.menuTab}>{copy.bakery}</Text></ScrollView>{RESTAURANTS[0].dishes.map((dish, index) => <View key={dish.id} style={styles.menuDishCard}><Image source={{ uri: dish.image }} style={styles.menuDishImage} /><View style={styles.menuDishOverlay} /><View style={styles.menuDishCopy}><Text style={styles.menuDishName}>{locale === 'en' ? dish.nameEn : locale === 'uz' ? dish.nameUz : dish.name}</Text><Text style={styles.menuDishDescription}>{locale === 'en' ? dish.descriptionEn : locale === 'uz' ? dish.descriptionUz : dish.description}</Text><Text style={styles.menuDishPrice}>{formatMoney(dish.price, locale)}</Text></View><Pressable onPress={() => onAdd(dish)} style={styles.menuAddButton}><Icon name="add" size={20} color={COLORS.white} /><Text style={styles.menuAddText}>{copy.add}</Text></Pressable>{index === 0 ? <View style={styles.menuPopularTag}><Icon name="star" size={12} color={COLORS.tomato} /><Text style={styles.menuPopularText}>{copy.recommended}</Text></View> : null}</View>)}</ScrollView>{cart.length > 0 ? <Pressable onPress={onCart} style={styles.cartFloat}><View style={styles.cartFloatCount}><Text style={styles.cartFloatCountText}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</Text></View><Text style={styles.cartFloatText}>{copy.cart}</Text><Text style={styles.cartFloatTotal}>{formatMoney(cart.reduce((sum, item) => sum + item.price * item.quantity, 0), locale)}</Text><Icon name="arrow-forward" size={19} color={COLORS.white} /></Pressable> : null}</View>;
  */
}

function CartReviewScreen({ copy, locale, cart, onBack, onChangeQuantity, onPay }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cartContent}><TopBar onBack={onBack} title={copy.cart} /><Text style={styles.pageTitle}>{copy.tableMenu}</Text><Text style={styles.pageSubtitle}>Bukhara Nights · {copy.tableNumber} 14</Text>{cart.map((item) => <View key={item.id} style={styles.cartItem}><Image source={{ uri: item.image }} style={styles.cartItemImage} /><View style={styles.cartItemCopy}><Text style={styles.cartItemName}>{locale === 'en' ? item.nameEn : locale === 'uz' ? item.nameUz : item.name}</Text><Text style={styles.cartItemPrice}>{formatMoney(item.price, locale)}</Text><View style={styles.quantityRow}><Pressable onPress={() => onChangeQuantity(item.id, item.quantity - 1)} style={styles.quantityButton}><Icon name="remove" size={16} color={COLORS.ink} /></Pressable><Text style={styles.quantityValue}>{item.quantity}</Text><Pressable onPress={() => onChangeQuantity(item.id, item.quantity + 1)} style={styles.quantityButton}><Icon name="add" size={16} color={COLORS.ink} /></Pressable></View></View><Text style={styles.cartItemTotal}>{formatMoney(item.price * item.quantity, locale)}</Text></View>)}<View style={styles.cartSummary}><View style={styles.summaryRow}><Text style={styles.summaryLabel}>{copy.total}</Text><Text style={styles.summaryTotal}>{formatMoney(total, locale)}</Text></View><View style={styles.kitchenNotice}><Icon name="schedule" size={18} color={COLORS.tomato} /><View style={styles.kitchenNoticeCopy}><Text style={styles.kitchenNoticeText}>{copy.kitchenEstimate}: 12 {copy.min}</Text><Text style={styles.payLaterHint}>{copy.payAtEnd}</Text></View></View></View></ScrollView><View style={styles.stickyFooter}><Pressable onPress={onPay} style={styles.primaryButton}><Icon name="send" size={20} color={COLORS.white} /><Text style={styles.primaryButtonText}>{copy.sendOrder}</Text></Pressable></View></View>;
}

function CartScreen({ copy, locale, cart, onBack, onChangeQuantity, onPay }) {
  return <CartReviewScreen copy={copy} locale={locale} cart={cart} onBack={onBack} onChangeQuantity={onChangeQuantity} onPay={onPay} />;
  /*
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <View style={styles.screenFlex}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cartContent}><TopBar onBack={onBack} title={copy.cart} /><Text style={styles.pageTitle}>{copy.tableMenu}</Text><Text style={styles.pageSubtitle}>Bukhara Nights · {copy.tableNumber} 14</Text>{cart.map((item) => <View key={item.id} style={styles.cartItem}><Image source={{ uri: item.image }} style={styles.cartItemImage} /><View style={styles.cartItemCopy}><Text style={styles.cartItemName}>{locale === 'en' ? item.nameEn : locale === 'uz' ? item.nameUz : item.name}</Text><Text style={styles.cartItemPrice}>{formatMoney(item.price, locale)}</Text><View style={styles.quantityRow}><Pressable onPress={() => onChangeQuantity(item.id, item.quantity - 1)} style={styles.quantityButton}><Icon name="remove" size={16} color={COLORS.ink} /></Pressable><Text style={styles.quantityValue}>{item.quantity}</Text><Pressable onPress={() => onChangeQuantity(item.id, item.quantity + 1)} style={styles.quantityButton}><Icon name="add" size={16} color={COLORS.ink} /></Pressable></View></View><Text style={styles.cartItemTotal}>{formatMoney(item.price * item.quantity, locale)}</Text></View>)}<View style={styles.cartSummary}><View style={styles.summaryRow}><Text style={styles.summaryLabel}>{copy.total}</Text><Text style={styles.summaryTotal}>{formatMoney(total, locale)}</Text></View><View style={styles.kitchenNotice}><Icon name="schedule" size={18} color={COLORS.tomato} /><Text style={styles.kitchenNoticeText}>{copy.kitchenEstimate}: 12 {copy.min}</Text></View></View></ScrollView><View style={styles.stickyFooter}><Pressable onPress={onPay} style={styles.primaryButton}><Icon name="lock-outline" size={20} color={COLORS.white} /><Text style={styles.primaryButtonText}>{copy.sendOrder}</Text><Text style={styles.primaryButtonAmount}>{formatMoney(total, locale)}</Text></Pressable></View></View>;
  */
}

function PaymentSheet({ visible, copy, locale, mode, amount, savedCard, status, onClose, onLink, onCharge, onSuccess }) {
  const isBill = mode === 'bill';
  const isOrder = mode === 'order' || isBill;
  const hasLinkedCard = savedCard || status === 'linked';
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.paymentSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetKicker}>{isBill ? copy.finalBill : isOrder ? copy.orderPayment : copy.paymentTitle}</Text>
              <Text style={styles.sheetTitle}>{isBill ? copy.finalBill : isOrder ? copy.orderPayment : copy.confirmBooking}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.sheetClose}>
              <Icon name="close" size={21} color={COLORS.ink} />
            </Pressable>
          </View>

          {status === 'success' ? (
            <View style={styles.successState}>
              <View style={styles.successIcon}><Icon name="check" size={33} color={COLORS.white} /></View>
              <Text style={styles.successTitle}>{isBill ? copy.billPaid : isOrder ? copy.orderAccepted : copy.paymentSuccess}</Text>
              <Text style={styles.successHint}>{isBill ? copy.billPaidHint : isOrder ? `${copy.kitchenEstimate}: 12 ${copy.min}` : copy.paymentSuccessHint}</Text>
              <View style={styles.successReceipt}>
                <View>
                  <Text style={styles.receiptLabel}>{isOrder ? copy.total : copy.deposit}</Text>
                  <Text style={styles.receiptValue}>{isOrder ? formatMoney(amount, locale) : formatMoney(1000, locale)}</Text>
                </View>
                <Icon name="verified" size={25} color={COLORS.green} />
              </View>
              <Pressable onPress={onSuccess} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{isBill ? copy.tableMenu : isOrder ? copy.orderMenu : copy.openBooking}</Text>
                <Icon name="arrow-forward" size={19} color={COLORS.white} />
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.paymentAmountCard}>
                <View>
                  <Text style={styles.paymentAmountLabel}>{isBill ? copy.finalBill : isOrder ? copy.total : copy.deposit}</Text>
                  <Text style={styles.paymentAmountHint}>{isBill ? copy.payAtEnd : isOrder ? copy.demoNote : copy.depositHint}</Text>
                </View>
                <Text style={styles.paymentAmount}>{isOrder ? formatMoney(amount, locale) : formatMoney(1000, locale)}</Text>
              </View>

              {hasLinkedCard ? (
                <View style={styles.linkedCard}>
                  <View style={styles.linkedCardIcon}><Icon name="credit-card" size={22} color={COLORS.tomato} /></View>
                  <View style={styles.linkedCardCopy}>
                    <Text style={styles.linkedCardTitle}>{copy.cardSaved}</Text>
                    <Text style={styles.linkedCardNumber}>{copy.useCard}</Text>
                  </View>
                  <Icon name="check-circle" size={22} color={COLORS.green} />
                </View>
              ) : (
                <View style={styles.paymeWidget}>
                  <View style={styles.paymeWidgetTop}>
                    <View style={styles.paymeLogo}><Icon name="payments" size={20} color={COLORS.white} /></View>
                    <View style={styles.paymeWidgetCopy}>
                      <Text style={styles.paymeTitle}>Payme</Text>
                      <Text style={styles.paymeSubtitle}>{copy.paymeWidget}</Text>
                    </View>
                    <Icon name="lock" size={19} color={COLORS.green} />
                  </View>
                  <View style={styles.widgetLine} />
                  <Text style={styles.widgetStatus}>{status === 'linking' ? copy.linking : copy.paymeReady}</Text>
                  <Text style={styles.widgetHint}>{copy.cardLinkHint}</Text>
                </View>
              )}

              {status === 'linking' || status === 'charging' ? (
                <View style={[styles.primaryButton, styles.loadingButton]}>
                  <Text style={styles.primaryButtonText}>{status === 'linking' ? copy.linking : copy.charging}</Text>
                </View>
              ) : (
                <Pressable onPress={hasLinkedCard ? onCharge : onLink} style={styles.primaryButton}>
                  <Icon name={hasLinkedCard ? 'lock-outline' : 'credit-card'} size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>{hasLinkedCard ? (isBill ? copy.payFinalBill : copy.charge) : copy.connectPayme}</Text>
                </Pressable>
              )}
              <Text style={styles.paymentLegal}><Icon name="shield" size={14} color={COLORS.green} /> {copy.cardLinkHint}</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
  /*
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.paymentSheet}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Text style={styles.sheetKicker}>{isOrder ? copy.orderPayment : copy.paymentTitle}</Text><Text style={styles.sheetTitle}>{isOrder ? copy.orderPayment : copy.confirmBooking}</Text></View><Pressable onPress={onClose} style={styles.sheetClose}><Icon name="close" size={21} color={COLORS.ink} /></Pressable></View>{status === 'success' ? <View style={styles.successState}><View style={styles.successIcon}><Icon name="check" size={33} color={COLORS.white} /></View><Text style={styles.successTitle}>{isOrder ? copy.orderAccepted : copy.paymentSuccess}</Text><Text style={styles.successHint}>{isOrder ? `${copy.kitchenEstimate}: 12 ${copy.min}` : copy.paymentSuccessHint}</Text><View style={styles.successReceipt}><View><Text style={styles.receiptLabel}>{isOrder ? copy.total : copy.deposit}</Text><Text style={styles.receiptValue}>{isOrder ? formatMoney(amount, locale) : formatMoney(1000, locale)}</Text></View><Icon name="verified" size={25} color={COLORS.green} /></View><Pressable onPress={onSuccess} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{isOrder ? copy.orderMenu : copy.openBooking}</Text><Icon name="arrow-forward" size={19} color={COLORS.white} /></Pressable></View> : <><View style={styles.paymentAmountCard}><View><Text style={styles.paymentAmountLabel}>{isOrder ? copy.total : copy.deposit}</Text><Text style={styles.paymentAmountHint}>{isOrder ? copy.demoNote : copy.depositHint}</Text></View><Text style={styles.paymentAmount}>{isOrder ? formatMoney(amount, locale) : formatMoney(1000, locale)}</Text></View>{hasLinkedCard ? <View style={styles.linkedCard}><View style={styles.linkedCardIcon}><Icon name="credit-card" size={22} color={COLORS.tomato} /></View><View style={styles.linkedCardCopy}><Text style={styles.linkedCardTitle}>{copy.cardSaved}</Text><Text style={styles.linkedCardNumber}>{copy.useCard}</Text></View><Icon name="check-circle" size={22} color={COLORS.green} /></View> : <View style={styles.paymeWidget}><View style={styles.paymeWidgetTop}><View style={styles.paymeLogo}><Icon name="payments" size={20} color={COLORS.white} /></View><View><Text style={styles.paymeTitle}>Payme</Text><Text style={styles.paymeSubtitle}>{copy.paymeWidget}</Text></View><Icon name="lock" size={19} color={COLORS.green} /></View><View style={styles.widgetLine} /><Text style={styles.widgetStatus}>{status === 'linking' ? copy.linking : copy.paymeReady}</Text><Text style={styles.widgetHint}>{copy.cardLinkHint}</Text></View>}{status !== 'linking' && status !== 'charging' ? <Pressable onPress={hasLinkedCard ? onCharge : onLink} style={styles.primaryButton}>{hasLinkedCard ? <Icon name="lock-outline" size={20} color={COLORS.white} /> : <Icon name="credit-card" size={20} color={COLORS.white} />}<Text style={styles.primaryButtonText}>{hasLinkedCard ? copy.charge : copy.connectPayme}</Text></Pressable> : <View style={[styles.primaryButton, styles.loadingButton]}><Text style={styles.primaryButtonText}>{status === 'linking' ? copy.linking : copy.charging}</Text></View>}<Text style={styles.paymentLegal}><Icon name="shield" size={14} color={COLORS.green} /> {copy.cardLinkHint}</Text></>}</View>}</View></View></Modal>;
  */
}

function LanguageSheet({ visible, locale, onSelect, onClose }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable style={styles.languageBackdrop} onPress={onClose}><View style={styles.languageSheet}><Text style={styles.languageTitle}>Language / Язык / Til</Text>{[['ru', 'Русский'], ['uz', "O'zbekcha"], ['en', 'English']].map(([id, label]) => <Pressable key={id} onPress={() => onSelect(id)} style={styles.languageOption}><Text style={styles.languageOptionLabel}>{label}</Text>{locale === id ? <Icon name="check" size={21} color={COLORS.tomato} /> : null}</Pressable>)}</View></Pressable></Modal>;
}

function SettingsSheet({ visible, kind, copy, onClose, onApplyPromo, onOpenBot, onCallSupport }) {
  const [promo, setPromo] = useState('');
  if (!kind) return null;
  const title = kind === 'personal' ? copy.personal : kind === 'promo' ? copy.promo : kind === 'support' ? copy.support : copy.about;
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.settingsSheet}><View style={styles.sheetHeader}><View><Text style={styles.sheetKicker}>{copy.profile}</Text><Text style={styles.sheetTitle}>{title}</Text></View><Pressable onPress={onClose} style={styles.sheetClose}><Icon name="close" size={21} color={COLORS.ink} /></Pressable></View>{kind === 'personal' ? <View style={styles.settingsBody}><View style={styles.settingsInfoRow}><Icon name="person-outline" size={20} color={COLORS.tomato} /><View><Text style={styles.settingsLabel}>{copy.personal}</Text><Text style={styles.settingsValue}>Малика Саидова</Text></View></View><View style={styles.settingsInfoRow}><Icon name="phone" size={20} color={COLORS.tomato} /><View><Text style={styles.settingsLabel}>{copy.phone || 'Phone'}</Text><Text style={styles.settingsValue}>+998 90 123-45-67</Text></View></View><View style={styles.settingsInfoRow}><Icon name="send" size={20} color={COLORS.tomato} /><View><Text style={styles.settingsLabel}>Telegram</Text><Text style={styles.settingsValue}>{copy.personalHint}</Text></View></View><Pressable onPress={onClose} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{copy.close}</Text></Pressable></View> : null}{kind === 'promo' ? <View style={styles.settingsBody}><Text style={styles.settingsHint}>{copy.linkInProfile}</Text><TextInput value={promo} onChangeText={setPromo} placeholder={copy.promoPlaceholder} placeholderTextColor={COLORS.faint} style={styles.settingsInput} /><Pressable onPress={() => onApplyPromo(promo)} style={styles.primaryButton}><Icon name="sell" size={19} color={COLORS.white} /><Text style={styles.primaryButtonText}>{copy.applyPromo}</Text></Pressable></View> : null}{kind === 'support' ? <View style={styles.settingsBody}><Text style={styles.settingsHint}>{copy.supportHint}</Text><Pressable onPress={onOpenBot} style={styles.settingsActionButton}><Icon name="send" size={19} color={COLORS.tomato} /><Text style={styles.settingsActionText}>{copy.supportTelegram}</Text></Pressable><Pressable onPress={onCallSupport} style={styles.settingsActionButton}><Icon name="phone" size={19} color={COLORS.tomato} /><Text style={styles.settingsActionText}>{copy.supportPhone}</Text></Pressable></View> : null}{kind === 'about' ? <View style={styles.settingsBody}><View style={styles.aboutMark}><Text style={styles.aboutMarkText}>W</Text></View><Text style={styles.settingsAboutText}>{copy.aboutText}</Text><Text style={styles.settingsVersion}>Waitly Web App · 1.0</Text><Pressable onPress={onClose} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{copy.close}</Text></Pressable></View> : null}</View></View></Modal>;
}

function TelegramRegistrationGate({ copy, telegramUser, phone, setPhone, onSubmit, onRequestContact, submitting }) {
  return <SafeAreaView style={styles.registrationPage}><View style={styles.registrationCard}><View style={styles.registrationIcon}><Icon name="send" size={30} color={COLORS.white} /></View><Text style={styles.registrationTitle}>{copy.telegramRegisterTitle}</Text><Text style={styles.registrationHint}>{copy.telegramRegisterHint}</Text><View style={styles.telegramIdentity}><View style={styles.telegramAvatar}><Text style={styles.telegramAvatarText}>{(telegramUser?.first_name || 'T').slice(0, 1).toUpperCase()}</Text></View><View style={styles.telegramIdentityCopy}><Text style={styles.telegramIdentityName}>{telegramUser?.first_name || 'Telegram user'}</Text><Text style={styles.telegramIdentityMeta}>{telegramUser?.username ? `@${telegramUser.username}` : 'Telegram Web App'}</Text></View><Icon name="verified-user" size={20} color={COLORS.green} /></View><TextInput value={phone} onChangeText={setPhone} placeholder={copy.telegramPhonePlaceholder} placeholderTextColor={COLORS.faint} keyboardType="phone-pad" style={styles.registrationInput} /><Pressable onPress={onRequestContact} style={styles.contactButton}><Icon name="contacts" size={19} color={COLORS.tomato} /><Text style={styles.contactButtonText}>{copy.shareTelegramPhone}</Text></Pressable><Pressable onPress={onSubmit} disabled={submitting || !phone.trim()} style={[styles.primaryButton, (submitting || !phone.trim()) && styles.disabledButton]}><Icon name="check" size={20} color={COLORS.white} /><Text style={styles.primaryButtonText}>{submitting ? copy.registrationPending : copy.completeRegistration}</Text></Pressable><Text style={styles.registrationSecurity}><Icon name="lock" size={13} color={COLORS.green} /> {copy.cardVerificationHint}</Text></View></SafeAreaView>;
}

function getInitialTable(startParam = '') {
  const browserWindow = typeof globalThis !== 'undefined' ? globalThis.window : null;
  if (Platform.OS !== 'web') return null;
  try {
    const params = browserWindow ? new URLSearchParams(browserWindow.location.search) : null;
    const direct = params?.get('table') || params?.get('table_number') || params?.get('startapp');
    const fromHash = browserWindow?.location.hash.match(/table[_-]?(\d+)/i)?.[1];
    const match = String(direct || fromHash || startParam || '').match(/\d+/);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}

async function persistAuthResponse(data) {
  if (data?.access) await Storage.setItem('auth_access_token', data.access);
  if (data?.refresh) await Storage.setItem('auth_refresh_token', data.refresh);
}

export default function GuestWebApp() {
  const { width } = useWindowDimensions();
  const { telegramUser, startParam, initData, isTelegramEnv } = useTelegram() || {};
  const [locale, setLocale] = useState('ru');
  const [verifiedMember, setVerifiedMember] = useState(false);
  const copy = { ...COPY[locale], premium: verifiedMember ? COPY[locale].verifiedMember : COPY[locale].member };
  const initialTable = getInitialTable(startParam);
  const [screen, setScreen] = useState(initialTable ? 'table' : 'home');
  const [selectedRestaurant, setSelectedRestaurant] = useState(RESTAURANTS[0]);
  const [favorite, setFavorite] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('15');
  const [guests, setGuests] = useState(2);
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [notes, setNotes] = useState('');
  const [tableNumber, setTableNumber] = useState(initialTable || '14');
  const [guestToken, setGuestToken] = useState('');
  const [cart, setCart] = useState([]);
  const [order, setOrder] = useState(null);
  const [billPaid, setBillPaid] = useState(false);
  const [kitchenStep, setKitchenStep] = useState(1);
  const [booking, setBooking] = useState({ name: 'Caravan Restaurant', date: '24 октября, Четверг', time: '19:30', guests: 2, image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85', price: '$$' });
  const [savedCard, setSavedCard] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState('booking');
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState(null);
  const [toast, setToast] = useState('');
  const [dataStatus, setDataStatus] = useState('loading');
  const [memberStatus, setMemberStatus] = useState('checking');
  const [registrationPhone, setRegistrationPhone] = useState('');
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false);
  const userName = telegramUser?.first_name || (locale === 'en' ? 'Malika' : locale === 'uz' ? 'Malika' : 'Малика');

  UI_ACTION_HANDLER = ({ text, icon }) => {
    if (icon === 'share') {
      if (Share?.share) Share.share({ message: `${selectedRestaurant.name} · Waitly` }).catch(() => null);
      else setToast(copy.actionDone);
      return;
    }
    if (icon === 'logout') {
      Storage.multiRemove(['auth_access_token', 'auth_refresh_token', 'user_data', 'user_role']);
      setVerifiedMember(false);
      setSavedCard(false);
      setScreen('home');
      setToast(copy.logout);
      return;
    }
    if (text?.toLowerCase().includes('маршрут') || text?.toLowerCase().includes('directions') || text?.toLowerCase().includes('yo')) {
      Linking.openURL('https://maps.google.com/?q=Tashkent').catch(() => setToast(copy.map));
      return;
    }
    setToast(text?.trim() || copy.actionDone);
  };

  useEffect(() => {
    const linkedTable = getInitialTable(startParam);
    if (linkedTable) {
      setTableNumber(linkedTable);
      setScreen('table');
    }
  }, [startParam]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let active = true;
    if (!isTelegramEnv || !initData) {
      setMemberStatus('demo');
      return () => {
        active = false;
      };
    }

    api.post('/auth/telegram/', { initData }).then(({ data }) => {
      if (!active) return;
      persistAuthResponse(data);
      setVerifiedMember(Boolean(data?.user?.is_verified_member));
      setMemberStatus(data?.needs_phone_link ? 'phone' : 'registered');
    }).catch(() => {
      if (active) setMemberStatus('demo');
    });

    return () => {
      active = false;
    };
  }, [initData, isTelegramEnv]);

  useEffect(() => {
    let active = true;
    api.get('/public/reviews/hub/').then(({ data }) => {
      const liveRestaurants = (data?.restaurants || []).map(normalizeLiveRestaurant);
      if (!active || !liveRestaurants.length) return;
      RESTAURANTS = liveRestaurants;
      setSelectedRestaurant(liveRestaurants[0]);
      setDataStatus('live');
    }).catch(() => {
      if (active) setDataStatus('mock');
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    Storage.getItem(PAYME_CARD_REF_KEY).then((value) => {
      if (value) {
        setSavedCard(true);
        setVerifiedMember(true);
      }
    }).catch(() => null);
  }, []);

  useEffect(() => {
    if (screen !== 'table' || !selectedRestaurant?.slug) return undefined;
    let active = true;
    api.get(`/guest/bootstrap/${selectedRestaurant.slug}/${tableNumber}/`).then(({ data }) => {
      if (!active) return null;
      setGuestToken(data.guest_token || '');
      if (!data.guest_token) return null;
      return api.get('/guest/orders/active/', { params: { guest_token: data.guest_token } });
    }).then((response) => {
      const remoteOrder = response?.data?.orders?.[0];
      if (!active || !remoteOrder) return;
      const remoteStatus = remoteOrder.status;
      setOrder({
        id: remoteOrder.id,
        total: Number(remoteOrder.total_amount || 0),
        items: remoteOrder.items || [],
      });
      setKitchenStep(remoteStatus === 'READY' ? 3 : remoteStatus === 'COOKING' ? 2 : 1);
    }).catch(() => null);
    return () => {
      active = false;
    };
  }, [screen, selectedRestaurant?.slug, tableNumber]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const openRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setScreen('detail');

    if (!restaurant.slug) return;
    api.get(`/public/menu/${restaurant.slug}/`).then(({ data }) => {
      setSelectedRestaurant((current) => current.id === restaurant.id ? mergeLiveMenu(restaurant, data) : current);
    }).catch(() => null);
  };

  const addToCart = (dish) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === dish.id);
      if (existing) return current.map((item) => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...dish, quantity: 1 }];
    });
    setToast(locale === 'en' ? 'Added to cart' : locale === 'uz' ? "Savatga qo'shildi" : 'Добавлено в корзину');
  };

  const changeQuantity = (id, quantity) => setCart((current) => quantity <= 0 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity } : item));

  const callWaiter = async () => {
    if (!guestToken) {
      setToast(copy.callWaiterDone);
      return;
    }
    try {
      await api.post('/guest/waiter-calls/', { guest_token: guestToken });
      setToast(copy.callWaiterDone);
    } catch (error) {
      setToast(error.response?.data?.message || copy.callWaiterDone);
    }
  };

  const submitOrder = () => {
    if (!cart.length) return;
    const nextItems = [...(order?.items || [])];
    cart.forEach((item) => {
      const existing = nextItems.find((entry) => entry.id === item.id);
      if (existing) existing.quantity += item.quantity;
      else nextItems.push({ ...item });
    });
    const nextTotal = nextItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setOrder({ id: order?.id || `W-${String(Date.now()).slice(-4)}`, items: nextItems, total: nextTotal });
    setBillPaid(false);
    setCart([]);
    setKitchenStep(1);
    setScreen('table');
    setToast(copy.orderAccepted);
  };

  const openPayment = (mode) => {
    setPaymentMode(mode);
    setPaymentStatus(savedCard ? 'linked' : 'idle');
    setPaymentOpen(true);
  };

  const linkPayme = () => {
    setPaymentStatus('linking');
    setTimeout(() => {
      setSavedCard(true);
      Storage.setItem(PAYME_CARD_REF_KEY, JSON.stringify({ provider: 'payme', last4: '4242', tokenized: true, demo: true }));
      api.post('/payments/cards/demo-bind/', { restaurant_id: selectedRestaurant.id }).then(({ data }) => {
        if (data?.is_verified_member) setVerifiedMember(true);
      }).catch(() => {
        if (!isTelegramEnv) setVerifiedMember(true);
      });
      setPaymentStatus('linked');
      setToast(locale === 'en' ? 'Payme card linked securely' : locale === 'uz' ? 'Payme kartasi xavfsiz ulandi' : 'Карта Payme привязана безопасно');
    }, 850);
  };

  const submitTelegramRegistration = async () => {
    if (!initData || !registrationPhone.trim()) return;
    setRegistrationSubmitting(true);
    try {
      const { data } = await api.post('/auth/telegram/link-phone/', {
        initData,
        phone_number: registrationPhone.trim(),
      });
      await persistAuthResponse(data);
      setVerifiedMember(Boolean(data?.user?.is_verified_member));
      setMemberStatus('registered');
    } catch (error) {
      setToast(error.response?.data?.message || 'Не удалось подтвердить номер Telegram');
    } finally {
      setRegistrationSubmitting(false);
    }
  };

  const requestTelegramContact = () => {
    try {
      const WebApp = require('@twa-dev/sdk').default;
      WebApp.requestContact((contact) => {
        if (contact?.phone_number) setRegistrationPhone(contact.phone_number);
      });
    } catch {
      setToast(copy.telegramPhonePlaceholder);
    }
  };

  const chargePayment = () => {
    setPaymentStatus('charging');
    setTimeout(() => {
      if (paymentMode === 'booking') {
        setBooking({ name: selectedRestaurant.name, date: `${selectedDate} мая`, time: selectedTime, guests, image: selectedRestaurant.image, price: selectedRestaurant.price });
      } else if (paymentMode === 'bill') {
        setBillPaid(true);
      } else {
        setOrder({ id: 'W-1048' });
        setCart([]);
        setKitchenStep(1);
      }
      setPaymentStatus('success');
    }, 900);
  };

  const finishPayment = () => {
    setPaymentOpen(false);
    setPaymentStatus('idle');
    setScreen(paymentMode === 'booking' ? 'bookings' : 'table');
    setToast(paymentMode === 'booking' ? copy.paymentSuccess : paymentMode === 'bill' ? copy.billPaid : copy.orderAccepted);
  };

  const openBot = async () => {
    try {
      await Linking.openURL('https://t.me/waitly_bot?start=table_14');
    } catch {
      setToast(copy.inTelegram);
    }
  };

  const applyPromo = (code) => {
    setSettingsPanel(null);
    setToast(code?.trim() ? copy.settingsSaved : copy.promoPlaceholder);
  };

  const callSupport = () => {
    Linking.openURL('tel:+998712000000').catch(() => setToast(copy.supportPhone));
  };

  const renderScreen = () => {
    if (memberStatus === 'phone') return <TelegramRegistrationGate copy={copy} telegramUser={telegramUser} phone={registrationPhone} setPhone={setRegistrationPhone} onSubmit={submitTelegramRegistration} onRequestContact={requestTelegramContact} submitting={registrationSubmitting} />;
    if (screen === 'detail') return <DetailScreen restaurant={selectedRestaurant} copy={copy} favorite={favorite} onFavorite={() => setFavorite(!favorite)} onBack={() => setScreen('home')} onReserve={() => setScreen('booking')} onMenu={() => setScreen('menu')} />;
    if (screen === 'booking') return <BookingScreen restaurant={selectedRestaurant} copy={copy} locale={locale} selectedDate={selectedDate} setSelectedDate={setSelectedDate} guests={guests} setGuests={setGuests} selectedTime={selectedTime} setSelectedTime={setSelectedTime} notes={notes} setNotes={setNotes} onBack={() => setScreen('detail')} onConfirm={() => openPayment('booking')} />;
    if (screen === 'bookings') return <BookingsScreen copy={copy} booking={booking} onEdit={() => setScreen('booking')} onHome={() => setScreen('home')} onSearch={() => setScreen('home')} onProfile={() => setScreen('profile')} />;
    if (screen === 'profile') return <ProfileScreen copy={copy} locale={locale} savedCard={savedCard} onLanguage={() => setLanguageOpen(true)} onHome={() => setScreen('home')} onSearch={() => setScreen('home')} onBookings={() => setScreen('bookings')} onLinkCard={() => openPayment('booking')} onSettings={setSettingsPanel} />;
    if (screen === 'table') return <TableScreen copy={copy} tableNumber={tableNumber} kitchenStep={kitchenStep} order={order} onMenu={() => setScreen('menu')} onHome={() => setScreen('home')} onSearch={() => setScreen('home')} onBookings={() => setScreen('bookings')} onCallWaiter={callWaiter} onProfile={() => setScreen('profile')} onAdvanceKitchen={() => setKitchenStep(Math.min(3, kitchenStep + 1))} onOpenBot={openBot} />;
    if (screen === 'menu') return <MenuScreen restaurant={selectedRestaurant} copy={copy} locale={locale} cart={cart} onBack={() => setScreen('table')} onAdd={addToCart} onRemove={(dishId) => changeQuantity(dishId, (cart.find((item) => item.id === dishId)?.quantity || 1) - 1)} onCart={() => setScreen('cart')} tableNumber={tableNumber} />;
    if (screen === 'cart') return <CartScreen copy={copy} locale={locale} cart={cart} onBack={() => setScreen('menu')} onChangeQuantity={changeQuantity} onPay={submitOrder} />;
    return <HomeScreen copy={copy} userName={userName} dataStatus={dataStatus} query={query} setQuery={setQuery} onSearch={() => setScreen('home')} onRestaurant={openRestaurant} onTable={() => setScreen('table')} onProfile={() => setScreen('profile')} onBookings={() => setScreen('bookings')} />;
  };

  return <SafeAreaView style={styles.page}><View style={[styles.appShell, width > 700 && styles.appShellDesktop]}><View style={styles.appSurface}>{renderScreen()}{screen === 'table' && order && !billPaid ? <Animated.View style={styles.billFloat}><Pressable onPress={() => openPayment('bill')} style={styles.billFloatPressable}><View><Text style={styles.billFloatKicker}>{copy.finalBill}</Text><Text style={styles.billFloatAmount}>{formatMoney(order.total, locale)}</Text></View><View style={styles.billFloatAction}><Icon name="lock-outline" size={17} color={COLORS.white} /><Text style={styles.billFloatActionText}>{copy.payAtEnd}</Text></View></Pressable></Animated.View> : null}{screen === 'table' && order && billPaid ? <View style={styles.billPaidPill}><Icon name="check-circle" size={16} color={COLORS.green} /><Text style={styles.billPaidText}>{copy.billPaid}</Text></View> : null}</View></View>{toast ? <View style={styles.toast}><Icon name="check-circle" size={18} color={COLORS.white} /><Text style={styles.toastText}>{toast}</Text></View> : null}<PaymentSheet visible={paymentOpen} copy={copy} locale={locale} mode={paymentMode} amount={paymentMode === 'bill' ? order?.total || 0 : cartTotal} savedCard={savedCard} status={paymentStatus} onClose={() => setPaymentOpen(false)} onLink={linkPayme} onCharge={chargePayment} onSuccess={finishPayment} /><LanguageSheet visible={languageOpen} locale={locale} onClose={() => setLanguageOpen(false)} onSelect={(next) => { setLocale(next); setLanguageOpen(false); }} /><SettingsSheet visible={Boolean(settingsPanel)} kind={settingsPanel} copy={copy} onClose={() => setSettingsPanel(null)} onApplyPromo={applyPromo} onOpenBot={openBot} onCallSupport={callSupport} /></SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#e9eceb' },
  registrationPage: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: COLORS.canvas },
  registrationCard: { padding: 22, borderRadius: 24, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, shadowColor: '#1e1712', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 },
  registrationIcon: { width: 62, height: 62, alignSelf: 'center', borderRadius: 22, backgroundColor: '#2b94cf', alignItems: 'center', justifyContent: 'center' },
  registrationTitle: { marginTop: 18, color: COLORS.ink, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  registrationHint: { marginTop: 9, color: COLORS.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  telegramIdentity: { marginTop: 20, padding: 12, borderRadius: 15, backgroundColor: '#edf6fb', flexDirection: 'row', alignItems: 'center' },
  telegramAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#2b94cf', alignItems: 'center', justifyContent: 'center' },
  telegramAvatarText: { color: COLORS.white, fontSize: 17, fontWeight: '800' },
  telegramIdentityCopy: { flex: 1, marginLeft: 10 },
  telegramIdentityName: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  telegramIdentityMeta: { marginTop: 3, color: '#397b9e', fontSize: 11 },
  registrationInput: { height: 52, marginTop: 17, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, color: COLORS.ink, fontSize: 15, backgroundColor: COLORS.white, outlineStyle: 'none' },
  contactButton: { height: 44, marginTop: 10, borderWidth: 1, borderColor: COLORS.coralSoft, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  contactButtonText: { color: COLORS.tomato, fontSize: 12, fontWeight: '800' },
  registrationSecurity: { marginTop: 15, color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  disabledButton: { opacity: 0.45 },
  appShell: { flex: 1, width: '100%', alignSelf: 'center' },
  appShellDesktop: { maxWidth: 520, shadowColor: '#17201e', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 28 },
  appSurface: { flex: 1, backgroundColor: COLORS.canvas, overflow: 'hidden' },
  screenFlex: { flex: 1 },
  homeContent: { paddingBottom: 105 },
  topBar: { height: 74, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(232,228,223,0.74)', backgroundColor: COLORS.canvas },
  topBarSpacer: { width: 38 },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: COLORS.ink },
  brand: { fontSize: 27, fontWeight: '800', letterSpacing: -1.2, color: COLORS.tomato },
  iconButton: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarButton: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, justifyContent: 'center', alignItems: 'center' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qrButton: { height: 34, borderRadius: 17, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.coralSoft, backgroundColor: '#fff5f1', flexDirection: 'row', alignItems: 'center', gap: 5 },
  qrButtonText: { fontSize: 11, color: COLORS.tomato, fontWeight: '700' },
  eyebrow: { marginTop: 24, paddingHorizontal: 20, fontSize: 13, color: COLORS.muted },
  homeTitle: { marginTop: 5, paddingHorizontal: 20, fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8, color: COLORS.ink, maxWidth: 390 },
  searchBox: { height: 54, marginHorizontal: 16, marginTop: 22, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 5 },
  searchInput: { flex: 1, minWidth: 0, marginHorizontal: 9, color: COLORS.ink, fontSize: 14, outlineStyle: 'none' },
  searchAction: { minWidth: 68, height: 44, borderRadius: 12, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center' },
  searchActionText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  sectionTitleRow: { marginTop: 28, marginBottom: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.35 },
  sectionAction: { color: COLORS.tomato, fontSize: 13, fontWeight: '700' },
  chipScroll: { paddingHorizontal: 16, gap: 9 },
  categoryChip: { height: 44, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center', gap: 7 },
  categoryChipActive: { backgroundColor: COLORS.coral, borderColor: COLORS.coral },
  categoryChipText: { fontSize: 12, color: COLORS.ink, fontWeight: '600' },
  categoryChipTextActive: { color: COLORS.white },
  tableBanner: { marginHorizontal: 16, marginTop: 21, padding: 13, borderRadius: 18, backgroundColor: '#fff0e9', borderWidth: 1, borderColor: '#f8d5c7', flexDirection: 'row', alignItems: 'center' },
  tableBannerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  tableBannerCopy: { flex: 1, marginLeft: 11 },
  tableBannerTitle: { color: COLORS.tomato, fontSize: 13, fontWeight: '800' },
  tableBannerSubtitle: { marginTop: 3, color: COLORS.muted, fontSize: 11, lineHeight: 15 },
  tableBannerButton: { width: 35, height: 35, borderRadius: 18, backgroundColor: COLORS.tomato, alignItems: 'center', justifyContent: 'center' },
  restaurantCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper },
  restaurantImageWrap: { height: 184, position: 'relative' },
  restaurantImage: { width: '100%', height: '100%' },
  ratingBadge: { position: 'absolute', top: 11, right: 11, paddingHorizontal: 9, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,253,250,0.94)', flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '800', color: COLORS.ink },
  restaurantCardBody: { padding: 15 },
  restaurantNameLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restaurantName: { flex: 1, marginRight: 9, fontSize: 18, fontWeight: '800', color: COLORS.ink },
  priceText: { fontSize: 12, color: COLORS.muted, fontWeight: '800' },
  restaurantDescription: { marginTop: 7, color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', gap: 7, marginTop: 13 },
  metaPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, backgroundColor: '#f0eeeb', color: COLORS.muted, fontSize: 11 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 82, paddingHorizontal: 22, paddingBottom: 10, borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: 'rgba(255,253,250,0.97)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottomItem: { width: 62, alignItems: 'center', justifyContent: 'center' },
  bottomIcon: { width: 41, height: 34, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  bottomIconActive: { backgroundColor: COLORS.coralSoft },
  bottomLabel: { marginTop: 2, color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  bottomLabelActive: { color: COLORS.tomato, fontWeight: '800' },
  detailContent: { paddingBottom: 100 },
  detailHero: { height: 306, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  detailHeroImage: { width: '100%', height: '100%' },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(22,13,9,0.32)' },
  detailHeroActions: { position: 'absolute', top: 18, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between' },
  heroActionGroup: { flexDirection: 'row', gap: 8 },
  heroCircle: { width: 42, height: 42, borderRadius: 22, backgroundColor: 'rgba(255,253,250,0.93)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { position: 'absolute', left: 20, right: 20, bottom: 21 },
  tagRow: { flexDirection: 'row', gap: 8 },
  heroTag: { color: COLORS.white, backgroundColor: 'rgba(35,22,17,0.65)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, fontSize: 12, fontWeight: '700' },
  detailTitle: { marginTop: 10, color: COLORS.white, fontSize: 29, fontWeight: '800', letterSpacing: -0.7 },
  detailRating: { marginTop: 5, flexDirection: 'row', alignItems: 'center' },
  detailRatingText: { marginLeft: 5, color: COLORS.white, fontSize: 20, fontWeight: '800' },
  detailReviews: { marginLeft: 6, color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  infoGrid: { marginHorizontal: 20, paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: 'row', gap: 16 },
  infoCell: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  infoIcon: { width: 38, height: 38, borderRadius: 20, backgroundColor: '#f3f1ee', alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoLabel: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  infoValue: { marginTop: 4, color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  infoLink: { marginTop: 5, color: COLORS.tomato, fontSize: 12, fontWeight: '700' },
  detailSection: { marginHorizontal: 20, marginTop: 25 },
  detailSectionTitle: { color: COLORS.ink, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  aboutText: { marginTop: 12, color: COLORS.muted, fontSize: 15, lineHeight: 25 },
  menuPreviewCard: { minHeight: 102, padding: 10, marginBottom: 10, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center' },
  menuPreviewImage: { width: 82, height: 82, borderRadius: 12 },
  menuPreviewCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  menuPreviewName: { color: COLORS.ink, fontSize: 16, fontWeight: '700' },
  menuPreviewDescription: { marginTop: 4, color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  menuPreviewPrice: { marginTop: 5, color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  stickyFooter: { paddingHorizontal: 19, paddingVertical: 13, paddingBottom: 18, borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: 'rgba(255,253,250,0.97)' },
  primaryButton: { minHeight: 54, paddingHorizontal: 17, borderRadius: 14, backgroundColor: COLORS.coral, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, shadowColor: COLORS.coral, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 11 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  primaryButtonAmount: { color: COLORS.white, fontSize: 13, fontWeight: '700', marginLeft: 3 },
  bookingContent: { paddingBottom: 125 },
  languageBadge: { minWidth: 39, height: 30, borderRadius: 15, backgroundColor: COLORS.coralSoft, alignItems: 'center', justifyContent: 'center' },
  languageBadgeText: { color: COLORS.tomato, fontSize: 11, fontWeight: '800' },
  bookingRestaurant: { paddingHorizontal: 20, marginTop: 23, color: COLORS.ink, fontSize: 22, fontWeight: '800' },
  bookingSubtitle: { paddingHorizontal: 20, marginTop: 5, color: COLORS.muted, fontSize: 14 },
  formSectionTitle: { marginHorizontal: 20, marginTop: 28, marginBottom: 12, color: COLORS.ink, fontSize: 20, fontWeight: '800' },
  dateScroll: { paddingHorizontal: 20, gap: 10 },
  dateCard: { width: 66, height: 86, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' },
  dateCardActive: { borderColor: COLORS.coral, backgroundColor: '#fff5f1' },
  dateWeekday: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  dateWeekdayActive: { color: COLORS.tomato },
  dateNumber: { marginTop: 6, color: COLORS.ink, fontSize: 26, fontWeight: '800' },
  dateNumberActive: { color: COLORS.coral },
  guestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 },
  guestValue: { marginTop: 28, color: COLORS.muted, fontSize: 14 },
  guestControl: { height: 58, marginHorizontal: 20, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17 },
  guestControlButton: { width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  guestCount: { color: COLORS.ink, fontSize: 24, fontWeight: '800' },
  timeGrid: { marginHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: { width: 89, height: 47, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' },
  timeChipActive: { borderColor: COLORS.coral, backgroundColor: '#fff3ee' },
  timeText: { color: COLORS.ink, fontSize: 14, fontWeight: '600' },
  timeTextActive: { color: COLORS.coral, fontWeight: '800' },
  dinnerTitle: { marginTop: 26 },
  wishesTitle: { marginTop: 30 },
  notesInput: { minHeight: 112, marginHorizontal: 20, paddingHorizontal: 15, paddingTop: 13, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, color: COLORS.ink, fontSize: 14, lineHeight: 20, textAlignVertical: 'top', backgroundColor: COLORS.paper, outlineStyle: 'none' },
  bookingFooter: { minHeight: 78, position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 17, borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: 'rgba(255,253,250,0.98)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  footerCopy: { flex: 1, minWidth: 0 },
  footerSummary: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  footerRestaurant: { marginTop: 4, color: COLORS.muted, fontSize: 11 },
  bookingsContent: { paddingBottom: 105 },
  pageTitle: { paddingHorizontal: 20, marginTop: 21, color: COLORS.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  pageSubtitle: { paddingHorizontal: 20, marginTop: 7, marginBottom: 15, color: COLORS.muted, fontSize: 14 },
  bookingCard: { marginHorizontal: 16, marginBottom: 26, overflow: 'hidden', borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper },
  bookingCardImageWrap: { height: 170, position: 'relative' },
  bookingCardImage: { width: '100%', height: '100%' },
  confirmedBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 5 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  confirmedBadgeText: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  bookingCardBody: { padding: 16 },
  bookingCardTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bookingCardTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '800' },
  bookingCardPrice: { color: COLORS.muted, fontWeight: '700' },
  bookingInfoRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  bookingInfoText: { color: COLORS.muted, fontSize: 13 },
  bookingActions: { marginTop: 17, flexDirection: 'row', gap: 10 },
  secondaryAction: { flex: 1, height: 44, borderRadius: 11, backgroundColor: '#ebeae8', alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  coralAction: { flex: 1, height: 44, borderRadius: 11, backgroundColor: COLORS.coral, alignItems: 'center', justifyContent: 'center' },
  coralActionText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  pastCard: { minHeight: 110, marginHorizontal: 16, marginBottom: 12, padding: 10, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, backgroundColor: COLORS.paper, flexDirection: 'row' },
  pastImage: { width: 95, height: 90, borderRadius: 11 },
  pastCopy: { flex: 1, marginLeft: 12 },
  pastStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pastStatusText: { color: COLORS.muted, fontSize: 11 },
  pastName: { marginTop: 7, color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  pastInfo: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  pastButton: { height: 30, marginTop: 8, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  pastButtonText: { color: COLORS.ink, fontSize: 11, fontWeight: '600' },
  profileContent: { paddingBottom: 105 },
  profileHero: { marginHorizontal: 16, marginTop: 17, paddingVertical: 26, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, borderRadius: 23, backgroundColor: COLORS.paper },
  profileAvatar: { width: 92, height: 92, borderRadius: 47, backgroundColor: '#e9e4de', borderWidth: 7, borderColor: '#f4f1ee', alignItems: 'center', justifyContent: 'center' },
  profileInitials: { color: COLORS.tomato, fontSize: 24, fontWeight: '800' },
  profileEdit: { width: 35, height: 35, marginTop: -28, marginLeft: 65, borderRadius: 20, backgroundColor: COLORS.tomato, alignItems: 'center', justifyContent: 'center' },
  profileName: { marginTop: 19, color: COLORS.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.7 },
  profilePhone: { marginTop: 7, color: COLORS.muted, fontSize: 17 },
  premiumBadge: { marginTop: 16, paddingHorizontal: 19, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff0e9', flexDirection: 'row', alignItems: 'center', gap: 8 },
  premiumText: { color: COLORS.tomato, fontSize: 15, fontWeight: '700' },
  savedCardPanel: { marginHorizontal: 16, marginTop: 15, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: COLORS.coralSoft, backgroundColor: '#fff4ef', flexDirection: 'row', alignItems: 'center' },
  savedCardIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  savedCardCopy: { flex: 1, marginLeft: 11 },
  savedCardTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  savedCardHint: { marginTop: 3, color: COLORS.muted, fontSize: 12 },
  profileMenu: { marginHorizontal: 16, marginTop: 17, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper },
  profileRow: { minHeight: 67, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: 'row', alignItems: 'center' },
  profileRowIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#f0efed', alignItems: 'center', justifyContent: 'center' },
  profileRowText: { flex: 1, marginLeft: 12, color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  languageRow: { minHeight: 67, marginHorizontal: 16, marginTop: 12, paddingHorizontal: 13, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center' },
  currentLanguage: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, backgroundColor: COLORS.coralSoft },
  currentLanguageText: { color: COLORS.tomato, fontSize: 11, fontWeight: '800' },
  logoutButton: { height: 54, marginHorizontal: 16, marginTop: 17, marginBottom: 20, borderWidth: 1, borderColor: COLORS.tomato, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  logoutText: { color: COLORS.tomato, fontSize: 15, fontWeight: '700' },
  tableContent: { paddingBottom: 105 },
  telegramPill: { height: 32, alignSelf: 'center', marginTop: 17, paddingHorizontal: 12, borderRadius: 17, backgroundColor: '#e7f3fb', flexDirection: 'row', alignItems: 'center', gap: 6 },
  telegramPillText: { color: '#2b769e', fontSize: 11, fontWeight: '700' },
  tableHero: { marginHorizontal: 16, marginTop: 14, paddingVertical: 27, borderRadius: 22, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center' },
  tableHeroIcon: { width: 61, height: 61, borderRadius: 20, backgroundColor: COLORS.coralSoft, alignItems: 'center', justifyContent: 'center' },
  tableHeroKicker: { marginTop: 14, color: COLORS.green, fontSize: 13, fontWeight: '800' },
  tableHeroNumber: { marginTop: 5, color: COLORS.ink, fontSize: 31, fontWeight: '800' },
  tableHeroHint: { marginTop: 6, paddingHorizontal: 20, color: COLORS.muted, fontSize: 12, textAlign: 'center' },
  restaurantMini: { marginHorizontal: 16, marginTop: 14, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center' },
  restaurantMiniImage: { width: 54, height: 54, borderRadius: 12 },
  restaurantMiniCopy: { flex: 1, marginLeft: 11 },
  restaurantMiniName: { color: COLORS.ink, fontSize: 15, fontWeight: '800' },
  restaurantMiniAddress: { marginTop: 4, color: COLORS.muted, fontSize: 11 },
  kitchenCard: { marginHorizontal: 16, marginTop: 14, padding: 17, borderRadius: 17, backgroundColor: '#eff7f1', borderWidth: 1, borderColor: '#d5ebdb' },
  kitchenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kitchenLabel: { color: COLORS.green, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  kitchenTitle: { marginTop: 4, color: COLORS.ink, fontSize: 17, fontWeight: '800' },
  loadBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 5 },
  loadBadgeText: { color: COLORS.green, fontSize: 12, fontWeight: '800' },
  loadTrack: { height: 8, marginTop: 17, overflow: 'hidden', borderRadius: 4, backgroundColor: '#d3e9d9' },
  loadFill: { width: '42%', height: '100%', borderRadius: 4, backgroundColor: COLORS.green },
  kitchenFooter: { marginTop: 9, flexDirection: 'row', justifyContent: 'space-between' },
  kitchenEstimate: { color: COLORS.muted, fontSize: 11 },
  kitchenMinutes: { color: COLORS.green, fontSize: 12, fontWeight: '800' },
  tableActions: { marginHorizontal: 16, marginTop: 16, gap: 10 },
  outlineButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: COLORS.coralSoft, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineButtonText: { color: COLORS.tomato, fontSize: 14, fontWeight: '800' },
  botButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  botButtonText: { color: COLORS.tomato, fontSize: 12, fontWeight: '700' },
  orderStatusCard: { marginHorizontal: 16, marginTop: 14, padding: 17, borderRadius: 17, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line },
  orderStatusHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderStatusTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800' },
  orderStatusNumber: { color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  orderStatusMain: { marginTop: 7, color: COLORS.tomato, fontSize: 13, fontWeight: '800' },
  orderTimeline: { marginTop: 17, flexDirection: 'row', justifyContent: 'space-between' },
  orderStep: { flex: 1, alignItems: 'center', position: 'relative' },
  orderStepDot: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#ece9e5', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  orderStepDotActive: { backgroundColor: COLORS.coral },
  orderStepLine: { position: 'absolute', top: 11, left: '50%', width: '100%', height: 3, backgroundColor: '#ece9e5' },
  orderStepLineActive: { backgroundColor: COLORS.coral },
  orderStepText: { marginTop: 7, color: COLORS.muted, fontSize: 9, textAlign: 'center' },
  refreshStatus: { height: 34, marginTop: 13, borderRadius: 9, backgroundColor: '#fff3ee', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  refreshStatusText: { color: COLORS.tomato, fontSize: 11, fontWeight: '700' },
  menuContent: { paddingBottom: 105 },
  tablePill: { height: 31, paddingHorizontal: 9, borderRadius: 16, backgroundColor: COLORS.coralSoft, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tablePillText: { color: COLORS.tomato, fontSize: 11, fontWeight: '800' },
  menuKicker: { marginTop: 22, textAlign: 'center', color: COLORS.tomato, fontSize: 11, letterSpacing: 2, fontWeight: '800' },
  menuHeading: { marginTop: 5, textAlign: 'center', color: COLORS.ink, fontSize: 29, fontWeight: '800' },
  menuTabs: { marginTop: 19, paddingHorizontal: 20, gap: 9 },
  menuTabActive: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 20, backgroundColor: COLORS.tomato, color: COLORS.white, fontSize: 12, fontWeight: '800' },
  menuTab: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 20, backgroundColor: '#eeecea', color: COLORS.muted, fontSize: 12, fontWeight: '700' },
  menuDishCard: { height: 270, marginHorizontal: 20, marginTop: 18, overflow: 'hidden', borderRadius: 24, position: 'relative', backgroundColor: COLORS.dark },
  menuDishImage: { width: '100%', height: '100%' },
  menuDishOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,14,11,0.43)' },
  menuDishCopy: { position: 'absolute', left: 18, right: 18, bottom: 18 },
  menuDishName: { color: COLORS.white, fontSize: 24, fontWeight: '800' },
  menuDishDescription: { marginTop: 7, color: 'rgba(255,255,255,0.83)', fontSize: 13, lineHeight: 18 },
  menuDishPrice: { marginTop: 8, color: COLORS.white, fontSize: 15, fontWeight: '800' },
  menuAddButton: { position: 'absolute', right: 14, bottom: 14, height: 37, paddingHorizontal: 11, borderRadius: 19, backgroundColor: COLORS.tomato, flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuAddText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  menuQuantityControl: { position: 'absolute', right: 14, bottom: 14, height: 39, paddingHorizontal: 6, borderRadius: 20, backgroundColor: COLORS.tomato, flexDirection: 'row', alignItems: 'center', gap: 5 },
  menuQuantityButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  menuQuantityText: { minWidth: 20, color: COLORS.white, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  menuPopularTag: { position: 'absolute', top: 13, left: 13, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuPopularText: { color: COLORS.ink, fontSize: 10, fontWeight: '700' },
  cartFloat: { position: 'absolute', left: 19, right: 19, bottom: 18, minHeight: 55, paddingHorizontal: 13, borderRadius: 15, backgroundColor: COLORS.tomato, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: COLORS.tomato, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
  cartFloatPressable: { flex: 1, minHeight: 55, paddingHorizontal: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  cartFloatCount: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  cartFloatCountText: { color: COLORS.tomato, fontSize: 12, fontWeight: '800' },
  cartFloatText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  cartFloatTotal: { flex: 1, color: COLORS.white, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  billFloat: { position: 'absolute', left: 17, right: 17, bottom: 91, borderRadius: 17, backgroundColor: COLORS.ink, shadowColor: '#000', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.2, shadowRadius: 16, zIndex: 8 },
  billFloatPressable: { minHeight: 62, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  billFloatKicker: { color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  billFloatAmount: { marginTop: 4, color: COLORS.white, fontSize: 17, fontWeight: '800' },
  billFloatAction: { minHeight: 38, paddingHorizontal: 11, borderRadius: 12, backgroundColor: COLORS.coral, flexDirection: 'row', alignItems: 'center', gap: 6 },
  billFloatActionText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  billPaidPill: { position: 'absolute', left: 17, right: 17, bottom: 91, minHeight: 45, paddingHorizontal: 14, borderRadius: 14, backgroundColor: COLORS.greenSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, zIndex: 8 },
  billPaidText: { color: COLORS.green, fontSize: 13, fontWeight: '800' },
  cartContent: { paddingBottom: 105 },
  cartItem: { minHeight: 96, marginHorizontal: 16, marginTop: 11, padding: 10, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center' },
  cartItemImage: { width: 73, height: 73, borderRadius: 11 },
  cartItemCopy: { flex: 1, marginLeft: 11 },
  cartItemName: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  cartItemPrice: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  quantityButton: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#efedea', alignItems: 'center', justifyContent: 'center' },
  quantityValue: { minWidth: 16, color: COLORS.ink, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  cartItemTotal: { alignSelf: 'flex-start', marginTop: 3, color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  cartSummary: { marginHorizontal: 16, marginTop: 23, padding: 16, borderRadius: 17, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: COLORS.ink, fontSize: 16, fontWeight: '700' },
  summaryTotal: { color: COLORS.ink, fontSize: 20, fontWeight: '800' },
  kitchenNotice: { marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: COLORS.line, flexDirection: 'row', alignItems: 'center', gap: 7 },
  kitchenNoticeCopy: { flex: 1 },
  kitchenNoticeText: { color: COLORS.muted, fontSize: 12 },
  payLaterHint: { marginTop: 3, color: COLORS.tomato, fontSize: 11, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(27,20,16,0.42)' },
  paymentSheet: { maxHeight: '92%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: COLORS.canvas },
  sheetHandle: { width: 42, height: 4, alignSelf: 'center', borderRadius: 3, backgroundColor: '#d2cdc8' },
  sheetHeader: { marginTop: 19, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetKicker: { color: COLORS.tomato, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800' },
  sheetTitle: { marginTop: 5, color: COLORS.ink, fontSize: 23, fontWeight: '800' },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' },
  paymentAmountCard: { marginTop: 22, padding: 15, borderRadius: 16, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paymentAmountLabel: { color: COLORS.ink, fontSize: 14, fontWeight: '800' },
  paymentAmountHint: { maxWidth: 245, marginTop: 5, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  paymentAmount: { color: COLORS.tomato, fontSize: 18, fontWeight: '800', textAlign: 'right', maxWidth: 120 },
  paymeWidget: { marginTop: 14, padding: 16, borderRadius: 17, borderWidth: 1, borderColor: '#cbe1d2', backgroundColor: COLORS.greenSoft },
  paymeWidgetTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  paymeLogo: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#16a66a', alignItems: 'center', justifyContent: 'center' },
  paymeWidgetCopy: { flex: 1 },
  paymeTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '800' },
  paymeSubtitle: { marginTop: 2, color: COLORS.muted, fontSize: 10 },
  widgetLine: { height: 1, marginTop: 15, backgroundColor: '#cbe1d2' },
  widgetStatus: { marginTop: 13, color: COLORS.green, fontSize: 13, fontWeight: '800' },
  widgetHint: { marginTop: 5, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  linkedCard: { marginTop: 14, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: COLORS.coralSoft, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center' },
  linkedCardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.coralSoft, alignItems: 'center', justifyContent: 'center' },
  linkedCardCopy: { flex: 1, marginLeft: 10 },
  linkedCardTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  linkedCardNumber: { marginTop: 3, color: COLORS.muted, fontSize: 12 },
  loadingButton: { backgroundColor: COLORS.tomato },
  paymentLegal: { marginTop: 15, color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  successState: { paddingTop: 30, alignItems: 'center' },
  successIcon: { width: 66, height: 66, borderRadius: 33, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center' },
  successTitle: { marginTop: 16, color: COLORS.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  successHint: { marginTop: 6, color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  successReceipt: { width: '100%', marginTop: 22, padding: 15, borderRadius: 15, backgroundColor: COLORS.greenSoft, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { color: COLORS.muted, fontSize: 11 },
  receiptValue: { marginTop: 4, color: COLORS.green, fontSize: 18, fontWeight: '800' },
  languageBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(27,20,16,0.35)' },
  languageSheet: { padding: 20, paddingBottom: 30, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: COLORS.canvas },
  languageTitle: { marginBottom: 13, color: COLORS.ink, fontSize: 18, fontWeight: '800' },
  languageOption: { minHeight: 52, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  languageOptionLabel: { color: COLORS.ink, fontSize: 15, fontWeight: '600' },
  settingsSheet: { maxHeight: '84%', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: COLORS.canvas },
  settingsBody: { paddingTop: 22 },
  settingsInfoRow: { minHeight: 62, paddingHorizontal: 13, marginBottom: 10, borderRadius: 15, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsLabel: { color: COLORS.muted, fontSize: 11 },
  settingsValue: { marginTop: 4, color: COLORS.ink, fontSize: 14, fontWeight: '700' },
  settingsHint: { color: COLORS.muted, fontSize: 13, lineHeight: 19 },
  settingsInput: { height: 52, marginTop: 16, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, color: COLORS.ink, backgroundColor: COLORS.white, outlineStyle: 'none' },
  settingsActionButton: { minHeight: 52, marginTop: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.coralSoft, backgroundColor: COLORS.paper, flexDirection: 'row', alignItems: 'center', gap: 9 },
  settingsActionText: { color: COLORS.tomato, fontSize: 14, fontWeight: '800' },
  aboutMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: COLORS.tomato, alignItems: 'center', justifyContent: 'center' },
  aboutMarkText: { color: COLORS.white, fontSize: 25, fontWeight: '800' },
  settingsAboutText: { marginTop: 16, color: COLORS.muted, fontSize: 14, lineHeight: 21 },
  settingsVersion: { marginTop: 9, marginBottom: 20, color: COLORS.faint, fontSize: 11 },
  toast: { position: 'absolute', left: 18, right: 18, bottom: 92, minHeight: 45, paddingHorizontal: 14, borderRadius: 13, backgroundColor: '#2c2824', flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 20 },
  toastText: { flex: 1, color: COLORS.white, fontSize: 13, fontWeight: '700' },
});
