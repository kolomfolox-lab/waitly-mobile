import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/KitchenContext', () => require('../../test/testUtils').createKitchenContextMock());

import Screen from '../kitchen/AvailableOrdersScreen';

test('kitchen/AvailableOrdersScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
