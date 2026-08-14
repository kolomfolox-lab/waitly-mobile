import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/NotificationsContext', () => require('../../test/testUtils').createNotificationsContextMock());

import Screen from '../waiter/NotificationsScreen';

test('waiter/NotificationsScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
