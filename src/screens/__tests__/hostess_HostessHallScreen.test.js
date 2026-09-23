import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../telegram/TelegramProvider', () => require('../../test/testUtils').createTelegramProviderMock());
jest.mock('../../api/hostess', () => ({
  getHostessTables: jest.fn(async () => []),
  markTableCleaned: jest.fn(async () => ({})),
  getHostessToday: jest.fn(async () => []),
}));

import Screen from '../hostess/HostessHallScreen';

test('hostess/HostessHallScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
