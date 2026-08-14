import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../telegram/TelegramProvider', () => require('../../test/testUtils').createTelegramProviderMock());

import Screen from '../common/LinkPhoneScreen';

test('common/LinkPhoneScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
