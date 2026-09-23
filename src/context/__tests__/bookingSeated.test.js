import { buildBookingSeatedNotifications } from '../NotificationsContext';

const now = new Date().toISOString();
const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

test('recent SEATED booking produces notification', () => {
  const out = buildBookingSeatedNotifications(
    [{ id: 'b1', status: 'SEATED', updated_at: now, client_name: 'Азиз', table_number: '5', guest_count: 2, table: 't1' }],
    { bookingSeated: true },
  );
  expect(out).toHaveLength(1);
  expect(out[0].type).toBe('BOOKING_SEATED');
  expect(out[0].message).toContain('Азиз');
});

test('old or non-seated bookings are ignored', () => {
  const out = buildBookingSeatedNotifications(
    [
      { id: 'b1', status: 'SEATED', updated_at: old },
      { id: 'b2', status: 'CONFIRMED', updated_at: now },
    ],
    { bookingSeated: true },
  );
  expect(out).toHaveLength(0);
});

test('disabled setting returns nothing', () => {
  const out = buildBookingSeatedNotifications(
    [{ id: 'b1', status: 'SEATED', updated_at: now }],
    { bookingSeated: false },
  );
  expect(out).toHaveLength(0);
});
