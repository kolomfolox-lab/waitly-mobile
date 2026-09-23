import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../telegram/TelegramProvider', () => require('../../test/testUtils').createTelegramProviderMock());
jest.mock('../../api/hostess', () => ({
  getHostessToday: jest.fn(async () => []),
  patchBooking: jest.fn(async (id, payload) => ({ id, ...payload })),
  bookingOnWay: jest.fn(async () => ({})),
  bookingLate15: jest.fn(async () => ({})),
  bookingArrived: jest.fn(async () => ({})),
  bookingSuggest: jest.fn(async () => []),
  hostessKpi: jest.fn(async () => ({ total: 0, seated: 0, noshow: 0, late_holds: 0 })),
  getWaitlist: jest.fn(async () => []),
  addWaitlist: jest.fn(async () => ({})),
  callWaitlist: jest.fn(async () => ({})),
  seatWaitlist: jest.fn(async () => ({})),
  cancelWaitlist: jest.fn(async () => ({})),
  getHandovers: jest.fn(async () => []),
  createHandover: jest.fn(async () => ({})),
  acceptHandover: jest.fn(async () => ({})),
}));

import Screen from '../hostess/HostessTodayScreen';

test('hostess/HostessTodayScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
