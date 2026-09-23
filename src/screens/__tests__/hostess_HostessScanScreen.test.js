import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../telegram/TelegramProvider', () => require('../../test/testUtils').createTelegramProviderMock());
jest.mock('../../api/hostess', () => ({
  resolveBookingQr: jest.fn(async () => ({})),
  patchBooking: jest.fn(async (id, payload) => ({ id, ...payload })),
  bookingArrived: jest.fn(async () => ({})),
  bookingTurnover: jest.fn(async () => ({})),
}));

import Screen from '../hostess/HostessScanScreen';

test('hostess/HostessScanScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
