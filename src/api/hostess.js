import apiClient from './apiClient';

const BASE = '/api/tables';

// ---------- Брони ----------
export const getHostessToday = async () => {
    const { data } = await apiClient.get(`${BASE}/bookings/today/`);
    return Array.isArray(data) ? data : data?.results || [];
};

export const patchBooking = async (id, payload) => {
    const { data } = await apiClient.patch(`${BASE}/bookings/${id}/`, payload);
    return data;
};

export const bookingOnWay = (id) => apiClient.post(`${BASE}/bookings/${id}/on_way/`).then((r) => r.data);
export const bookingLate15 = (id) => apiClient.post(`${BASE}/bookings/${id}/late_15/`).then((r) => r.data);
export const bookingArrived = (id, count = 1) =>
    apiClient.post(`${BASE}/bookings/${id}/arrived/`, { count }).then((r) => r.data);
export const bookingSuggest = (id) =>
    apiClient.get(`${BASE}/bookings/${id}/suggest/`).then((r) => r.data);
export const bookingTurnover = (id) =>
    apiClient.get(`${BASE}/bookings/${id}/turnover/`).then((r) => r.data);
export const hostessKpi = () => apiClient.get(`${BASE}/bookings/kpi/`).then((r) => r.data);

// ---------- QR (гость показывает — хостес сканирует) ----------
export const resolveBookingQr = (token) =>
    apiClient.post(`${BASE}/bookings/resolve/`, { token }).then((r) => r.data);
export const getBookingQr = (id) =>
    apiClient.get(`${BASE}/bookings/${id}/qr/`).then((r) => r.data);

// PNG QR для гостя: грузим авторизованно (в <Image> токен не передать).
export const getBookingQrImage = async (id) => {
    const { Platform } = require('react-native');
    const bust = `t=${Date.now()}`;
    if (Platform.OS === 'web') {
        const { data } = await apiClient.get(`${BASE}/bookings/${id}/qr/?as=png&${bust}`, {
            responseType: 'blob',
        });
        return URL.createObjectURL(data);
    }
    const Storage = require('../utils/storage').default;
    const base = await require('./baseUrl').ensureApiBase();
    const token = await Storage.getItem('auth_access_token');
    return {
        uri: `${base}${BASE}/bookings/${id}/qr/?as=png&${bust}`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
};

// ---------- Столы / уборка ----------
export const getHostessTables = async () => {
    const { data } = await apiClient.get(`${BASE}/tables/`);
    const list = Array.isArray(data) ? data : data?.results;
    return Array.isArray(list) ? list : [];
};

export const markTableCleaned = (id) =>
    apiClient.post(`${BASE}/tables/${id}/mark_cleaned/`).then((r) => r.data);

// ---------- Очередь зала ----------
export const getWaitlist = async () => {
    const { data } = await apiClient.get(`${BASE}/hall-waitlist/`);
    const list = Array.isArray(data) ? data : data?.results;
    return Array.isArray(list) ? list : [];
};

export const addWaitlist = (payload) =>
    apiClient.post(`${BASE}/hall-waitlist/`, payload).then((r) => r.data);
export const callWaitlist = (id) =>
    apiClient.post(`${BASE}/hall-waitlist/${id}/call/`).then((r) => r.data);
export const seatWaitlist = (id) =>
    apiClient.post(`${BASE}/hall-waitlist/${id}/seat/`).then((r) => r.data);
export const cancelWaitlist = (id) => apiClient.delete(`${BASE}/hall-waitlist/${id}/`);

// ---------- Work-бот: self-service привязка чата ----------
export const requestWorkBotLink = () =>
    apiClient.post('/api/v1/owner/telegram-work/link/', {}).then((r) => r.data);
export const getWorkBotStatus = () =>
    apiClient.get('/api/v1/owner/telegram-work/status/').then((r) => r.data);

// ---------- Передача смены ----------
export const getHandovers = async () => {
    const { data } = await apiClient.get(`${BASE}/handovers/`);
    const list = Array.isArray(data) ? data : data?.results;
    return Array.isArray(list) ? list : [];
};

export const createHandover = (note = '') =>
    apiClient.post(`${BASE}/handovers/`, { note }).then((r) => r.data);
export const acceptHandover = (id) =>
    apiClient.post(`${BASE}/handovers/${id}/accept/`).then((r) => r.data);
