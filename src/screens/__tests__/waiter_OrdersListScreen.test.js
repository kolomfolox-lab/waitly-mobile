import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/OrdersListScreen';

test('waiter/OrdersListScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
