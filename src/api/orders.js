import client from './client';

/**
 * Fetch active orders for kitchen (CREATED, ACCEPTED, COOKING, READY states)
 */
export const fetchActiveOrders = async () => {
    const response = await client.get('/orders/orders/', {
        params: {
            status: 'CREATED,ACCEPTED,COOKING,READY'
        }
    });
    return response.data;
};

/**
 * Accept an order (Chef takes it)
 */
export const acceptOrder = async (orderId) => {
    const response = await client.post(`/orders/orders/${orderId}/accept/`);
    return response.data;
};

/**
 * Mark order as ready
 */
export const markOrderReady = async (orderId) => {
    const response = await client.post(`/orders/orders/${orderId}/ready/`);
    return response.data;
};

/**
 * Add delay to an order with AI-generated apology
 */
export const addOrderDelay = async (orderId, extraMinutes, reason = '') => {
    const response = await client.post(`/orders/orders/${orderId}/add_delay/`, {
        extra_time: extraMinutes,
        reason: reason
    });
    return response.data;
};

/**
 * Mark order as delivered (for waiters)
 */
export const markOrderDelivered = async (orderId) => {
    const response = await client.post(`/orders/orders/${orderId}/deliver/`);
    return response.data;
};

/**
 * Create a new order
 */
export const createOrder = async (orderData) => {
    const response = await client.post('/orders/orders/', orderData);
    return response.data;
};
