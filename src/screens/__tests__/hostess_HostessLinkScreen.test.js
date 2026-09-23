import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../api/hostess', () => ({
  getWorkBotStatus: jest.fn(async () => ({ linked: false, bot_username: 'work_bot' })),
  requestWorkBotLink: jest.fn(async () => ({ bot_url: 'https://t.me/work_bot?start=CODE' })),
}));

import Screen from '../hostess/HostessLinkScreen';

test('hostess/HostessLinkScreen renders connect flow', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
  expect(view.getByText('Подключить')).toBeTruthy();
  expect(view.getByText('Я нажал Start — проверить')).toBeTruthy();
});
