import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/KitchenContext', () => require('../../test/testUtils').createKitchenContextMock());

import Screen from '../kitchen/KitchenDelayScreen';

test('kitchen/KitchenDelayScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {"orderId":"1"} });
  expect(view.toJSON()).toBeTruthy();
});
