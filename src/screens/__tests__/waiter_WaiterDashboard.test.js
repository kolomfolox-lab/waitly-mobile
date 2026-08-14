import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());

import Screen from '../waiter/WaiterDashboard';

test('waiter/WaiterDashboard renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
