import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../telegram/TelegramProvider', () => require('../../test/testUtils').createTelegramProviderMock());

import Screen from '../guest/GuestWebApp';

test('guest/GuestWebApp renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
