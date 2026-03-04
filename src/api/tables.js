import client from './client';

/**
 * Fetch all tables for the restaurant
 */
export const fetchTables = async () => {
    const response = await client.get('/tables/tables/');
    return response.data;
};

/**
 * Fetch bookings/reservations
 */
export const fetchBookings = async () => {
    const response = await client.get('/tables/bookings/');
    return response.data;
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData) => {
    const response = await client.post('/tables/bookings/', bookingData);
    return response.data;
};
