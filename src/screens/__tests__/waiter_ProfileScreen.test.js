import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../context/KitchenContext', () => require('../../test/testUtils').createKitchenContextMock());
jest.mock('../../context/NotificationsContext', () => require('../../test/testUtils').createNotificationsContextMock());

import Screen from '../waiter/ProfileScreen';

test('waiter/ProfileScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
