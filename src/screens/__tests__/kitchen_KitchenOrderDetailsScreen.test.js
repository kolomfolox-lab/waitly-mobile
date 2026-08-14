import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../context/KitchenContext', () => require('../../test/testUtils').createKitchenContextMock());

import Screen from '../kitchen/KitchenOrderDetailsScreen';

test('kitchen/KitchenOrderDetailsScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {"orderId":"1"} });
  expect(view.toJSON()).toBeTruthy();
});
