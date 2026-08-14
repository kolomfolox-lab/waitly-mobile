import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());

jest.mock('../../api/apiService', () => {
  const actual = jest.requireActual('../../api/apiService');
  return {
    ...actual,
    getSavingsGoal: jest.fn(async () => ({})),
    contributeToSavings: jest.fn(async () => ({})),
  };
});

import Screen from '../guest/GuestSavingsGoalScreen';

test('guest/GuestSavingsGoalScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
