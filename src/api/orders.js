import client from './client';

/**
 * Fetch kitchen orders. CANCELLED is included so cooks see losses immediately.
 */
export const fetchActiveOrders = async () => {
    const response = await client.get('/core/orders/', {
        params: {
            status: 'CREATED,ACCEPTED,COOKING,READY,CANCELLED'
        }
    });
    return response.data;
};

/**
 * Accept an order (Chef takes it)
 */
export const acceptOrder = async (orderId) => {
    const response = await client.post(`/core/orders/${orderId}/accept/`);
    return response.data;
};

/**
 * Mark order as ready
 */
export const markOrderReady = async (orderId) => {
    const response = await client.post(`/core/orders/${orderId}/ready/`);
    return response.data;
};

/**
 * Move a claimed order into cooking state
 */
export const startCookingOrder = async (orderId) => {
    const response = await client.post(`/core/orders/${orderId}/cooking/`);
    return response.data;
};

/**
 * Add delay to an order with AI-generated apology
 */
export const addOrderDelay = async (orderId, extraMinutes, reason = '') => {
    const response = await client.post(`/core/orders/${orderId}/add_delay/`, {
        extra_minutes: extraMinutes,
        reason: reason
    });
    return response.data;
};

/**
 * Mark order as delivered (for waiters)
 */
export const markOrderDelivered = async (orderId) => {
    const response = await client.post(`/core/orders/${orderId}/deliver/`);
    return response.data;
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
    const response = await client.post('/mobile/orders/create/', orderData);
    return response.data;
};
