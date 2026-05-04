import client from './client';

/**
 * Fetch all active shifts for the restaurant
 */
export const fetchActiveShifts = async () => {
    const response = await client.get('/core/shifts/');
    return response.data;
};

/**
 * Start a new work shift
 */
export const startShift = async () => {
    const response = await client.post('/core/shifts/start/');
    return response.data;
};

/**
 * End current work shift
 */
export const endShift = async (shiftId) => {
    const response = await client.post(`/core/shifts/${shiftId}/end/`);
    return response.data;
};

/**
 * Get current shift statistics
 */
export const getCurrentShiftStats = async () => {
    const response = await client.get('/core/shifts/current_stats/');
    return response.data;
};
