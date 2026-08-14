import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../context/KitchenContext', () => require('../../test/testUtils').createKitchenContextMock());

import Screen from '../bartender/BarDashboard';

test('bartender/BarDashboard renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
