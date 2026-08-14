import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../context/CartContext', () => require('../../test/testUtils').createCartContextMock());

import Screen from '../guest/GuestCartScreen';

test('guest/GuestCartScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
