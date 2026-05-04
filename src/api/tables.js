import client from './client';

/**
 * Fetch all tables for the restaurant
 */
export const fetchTables = async () => {
    const response = await client.get('/mobile/tables/live/');
    return response.data?.tables || response.data?.results || response.data || [];
};

/**
 * Fetch bookings/reservations
 */
export const fetchBookings = async () => {
    const response = await client.get('/core/bookings/');
    return response.data;
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData) => {
    const response = await client.post('/core/bookings/', bookingData);
    return response.data;
};
