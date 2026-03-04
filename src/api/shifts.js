import client from './client';

/**
 * Fetch all active shifts for the restaurant
 */
export const fetchActiveShifts = async () => {
    const response = await client.get('/orders/shifts/');
    return response.data;
};

/**
 * Start a new work shift
 */
export const startShift = async () => {
    const response = await client.post('/orders/shifts/start/');
    return response.data;
};

/**
 * End current work shift
 */
export const endShift = async (shiftId) => {
    const response = await client.post(`/orders/shifts/${shiftId}/end/`);
    return response.data;
};

/**
 * Get current shift statistics
 */
export const getCurrentShiftStats = async () => {
    const response = await client.get('/orders/shifts/current_stats/');
    return response.data;
};
