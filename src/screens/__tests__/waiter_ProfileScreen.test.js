import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../context/NotificationsContext', () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));
jest.mock('../../context/KitchenContext', () => ({
  useKitchen: () => ({}),
}));
jest.mock('../../api/apiService', () => ({
  getMe: jest.fn(async () => ({ full_name: 'Хостес', role: 'HOSTESS' })),
}));
jest.mock('../../api/hostess', () => ({
  requestWorkBotLink: jest.fn(async () => ({ bot_url: 'https://t.me/work_bot?start=CODE' })),
}));

import Screen from '../waiter/ProfileScreen';

test('waiter/ProfileScreen renders with work-bot link', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
  expect(view.getByText('Подключить work-бот')).toBeTruthy();
});
