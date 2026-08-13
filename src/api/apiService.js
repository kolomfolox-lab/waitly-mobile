import apiClient from './apiClient';

// =====================
// Auth
// =====================

export const authLogin = async (phoneNumber, password) => {
    const response = await apiClient.post('/api/auth/login/', {
        phone_number: phoneNumber,
        password,
    });
    return response.data;
};

export const getMe = async () => {
    const response = await apiClient.get('/api/auth/users/me/');
    return response.data;
};

export const updateFcmToken = async (fcmToken) => {
    const response = await apiClient.post('/api/auth/update_fcm_token/', {
        fcm_token: fcmToken,
    });
    return response.data;
};

// =====================
// Tables
// =====================

export const getTables = async () => {
    const response = await apiClient.get('/api/tables/tables/');
    return response.data; // Paginated: { count, next, previous, results }
};

export const transferTable = async (tableId, targetWaiterId, note = '') => {
    const response = await apiClient.post(`/api/v1/core/tables/${tableId}/transfer/`, {
        target_waiter_id: targetWaiterId,
        note,
    });
    return response.data;
};

// =====================
// Bookings
// =====================

export const getTodayBookings = async () => {
    const response = await apiClient.get('/api/tables/bookings/today/');
    return response.data;
};

// =====================
// Menu
// =====================

export const getCategories = async () => {
    const response = await apiClient.get('/api/menu/categories/');
    return response.data; // Paginated: { count, next, previous, results }
};

export const getDishes = async (params = {}) => {
    const response = await apiClient.get('/api/menu/dishes/', { params });
    return response.data; // Paginated
};

export const getDishesByCategory = async () => {
    const response = await apiClient.get('/api/menu/dishes/by_category/');
    return response.data;
};

// =====================
// Orders
// =====================

export const getOrders = async (params = {}) => {
    const response = await apiClient.get('/api/orders/orders/', { params });
    return response.data; // Paginated
};

export const getOrderDetail = async (orderId) => {
    const response = await apiClient.get(`/api/orders/orders/${orderId}/`);
    return response.data;
};

export const createOrder = async (tableId, items) => {
    const variants = [
        {
            table_id: tableId,
            items: items.map((item) => ({
                dish: item.dish || item.dish_id,
                quantity: Number(item.quantity),
                seat_number: item.seat_number,
                guest_label: item.guest_label,
            })),
        },
        {
            table_id: tableId,
            items: items.map((item) => ({
                dish_id: item.dish || item.dish_id,
                quantity: Number(item.quantity),
                seat_number: item.seat_number,
                guest_label: item.guest_label,
            })),
        },
        {
            table: tableId,
            items: items.map((item) => ({
                dish: item.dish || item.dish_id,
                quantity: Number(item.quantity),
                seat_number: item.seat_number,
                guest_label: item.guest_label,
            })),
        },
        {
            table: tableId,
            items: items.map((item) => ({
                dish_id: item.dish || item.dish_id,
                quantity: Number(item.quantity),
                seat_number: item.seat_number,
                guest_label: item.guest_label,
            })),
        },
    ];

    let lastError;

    for (const payload of variants) {
        try {
            const response = await apiClient.post('/api/orders/orders/', payload);
            return response.data;
        } catch (error) {
            lastError = error;
            if (error.response?.status !== 400) {
                throw error;
            }
        }
    }

    throw lastError;
};

export const acceptOrder = async (orderId) => {
    const response = await apiClient.post(`/api/orders/orders/${orderId}/accept/`);
    return response.data;
};

export const startOrderCooking = async (orderId) => {
    const response = await apiClient.post(`/api/orders/orders/${orderId}/cooking/`);
    return response.data;
};

export const markOrderReady = async (orderId) => {
    const response = await apiClient.post(`/api/orders/orders/${orderId}/ready/`);
    return response.data;
};

export const addOrderDelay = async (orderId, { extra_time, reason } = {}) => {
    const response = await apiClient.post(`/api/orders/orders/${orderId}/add_delay/`, {
        extra_time,
        reason,
    });
    return response.data;
};

export const updateOrder = async (orderId, payload) => {
    const response = await apiClient.patch(`/api/orders/orders/${orderId}/`, payload);
    return response.data;
};

export const assignOrderCook = async (orderId, cookId) => {
    const response = await apiClient.patch(`/api/orders/orders/${orderId}/`, {
        cook: cookId,
    });
    return response.data;
};

export const deliverOrder = async (orderId) => {
    const response = await apiClient.post(`/api/orders/orders/${orderId}/deliver/`);
    return response.data;
};

export const cancelOrder = async (orderId, payload = {}) => {
    const response = await apiClient.post(`/api/orders/orders/${orderId}/cancel/`, payload);
    return response.data;
};

// =====================
// Work Shifts
// =====================

export const startShift = async () => {
    const response = await apiClient.post('/api/orders/shifts/start/');
    return response.data;
};

export const endShift = async (shiftId) => {
    const response = await apiClient.post(`/api/orders/shifts/${shiftId}/end/`);
    return response.data;
};

export const getShiftStats = async () => {
    const response = await apiClient.get('/api/orders/shifts/current_stats/');
    return response.data;
};

// =====================
// Analytics
// =====================

export const getAnalyticsSummary = async () => {
    const response = await apiClient.get('/api/analytics/analytics/summary/');
    return response.data;
};

// =====================
// Dish Availability (Chef)
// =====================

export const toggleDishAvailability = async (dishId, payload = {}) => {
    const response = await apiClient.post(`/api/menu/dishes/${dishId}/toggle_availability/`, payload);
    return response.data;
};

export const getMenuSettings = async (params = {}) => {
    const response = await apiClient.get('/api/menu/settings/', { params });
    return response.data;
};

export const submitInventorySpotCheck = async ({ ingredient_id, counted_quantity, note }) => {
    const response = await apiClient.post('/api/v1/mobile/inventory/spot-check/', {
        ingredient_id,
        counted_quantity,
        note,
    });
    return response.data;
};

export const getUsers = async (params = {}) => {
    const response = await apiClient.get('/api/auth/users/', { params });
    return response.data;
};

// =====================
// Owner Endpoints
// =====================

export const getOwnerStats = async () => {
    const response = await apiClient.get('/api/owner/stats/');
    return response.data;
};

export const getOwnerTodayOrders = async () => {
    const response = await apiClient.get('/api/owner/orders/today/');
    return response.data;
};

export const getOwnerMe = async () => {
    const response = await apiClient.get('/api/owner/me/');
    return response.data;
};

// Owner - Staff
export const getOwnerStaff = async () => {
    const response = await apiClient.get('/api/owner/staff/');
    return response.data;
};

export const createStaff = async (data) => {
    const response = await apiClient.post('/api/owner/staff/', data);
    return response.data;
};

export const deleteStaff = async (staffId) => {
    const response = await apiClient.delete(`/api/owner/staff/${staffId}/`);
    return response.data;
};

// Owner - Menu Categories
export const createCategory = async (data) => {
    const response = await apiClient.post('/api/owner/menu/categories/', data);
    return response.data;
};

export const deleteCategory = async (categoryId) => {
    const response = await apiClient.delete(`/api/owner/menu/categories/${categoryId}/`);
    return response.data;
};

// Owner - Menu Dishes
export const createDish = async (formData) => {
    const response = await apiClient.post('/api/owner/menu/dishes/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateDish = async (dishId, formData) => {
    const response = await apiClient.put(`/api/owner/menu/dishes/${dishId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteDish = async (dishId) => {
    const response = await apiClient.delete(`/api/owner/menu/dishes/${dishId}/`);
    return response.data;
};

// Owner - Tables
export const getOwnerTables = async () => {
    const response = await apiClient.get('/api/owner/tables/');
    return response.data;
};

export const createTable = async (data) => {
    const response = await apiClient.post('/api/owner/tables/', data);
    return response.data;
};

export const deleteTable = async (tableId) => {
    const response = await apiClient.delete(`/api/owner/tables/${tableId}/`);
    return response.data;
};

// =====================
// Owner — Dashboard (v1 APIs)
// =====================

export const getOwnerDashboardSummary = async (restaurantId) => {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
    const response = await apiClient.get('/api/v1/owner/dashboard/summary/', { params });
    return response.data;
};

export const getOwnerStaffPerformance = async (restaurantId) => {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
    const response = await apiClient.get('/api/v1/owner/dashboard/staff-performance/', { params });
    return response.data;
};

export const getOwnerDashboardAnalytics = async (restaurantId) => {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
    const response = await apiClient.get('/api/v1/owner/dashboard/analytics/', { params });
    return response.data;
};

export const getMobileInventorySummary = async () => {
    const response = await apiClient.get('/api/v1/mobile/inventory/summary/');
    return response.data;
};

// =====================
// Owner — AI Agent
// =====================

export const aiChat = async ({ message, history = [], restaurant_id } = {}) => {
    const response = await apiClient.post('/api/owner/ai/chat/', {
        message,
        history,
        ...(restaurant_id ? { restaurant_id } : {}),
    });
    return response.data;
};

export const aiConfirmAction = async (pendingActionId, confirm) => {
    const response = await apiClient.post('/api/owner/ai/confirm/', {
        pending_action_id: pendingActionId,
        confirm,
    });
    return response.data;
};

export const aiPendingActions = async () => {
    const response = await apiClient.get('/api/owner/ai/pending/');
    return response.data;
};
