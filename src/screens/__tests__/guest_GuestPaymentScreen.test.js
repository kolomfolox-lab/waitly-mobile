import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../api/apiService', () => {
  const actual = jest.requireActual('../../api/apiService');
  return {
    ...actual,
    getServiceCharge: jest.fn(async () => ({ percent: 10 })),
    getSavingsGoal: jest.fn(async () => ({})),
    createTip: jest.fn(async () => ({})),
    contributeToSavings: jest.fn(async () => ({})),
  };
});

import Screen from '../guest/GuestPaymentScreen';

test('guest/GuestPaymentScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
