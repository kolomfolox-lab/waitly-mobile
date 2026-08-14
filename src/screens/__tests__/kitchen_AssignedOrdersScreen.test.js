import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/KitchenContext', () => require('../../test/testUtils').createKitchenContextMock());

import Screen from '../kitchen/AssignedOrdersScreen';

test('kitchen/AssignedOrdersScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
