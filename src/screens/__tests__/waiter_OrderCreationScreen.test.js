import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/OrderCreationScreen';

test('waiter/OrderCreationScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {"tableNumber":5,"tableId":"5"} });
  expect(view.toJSON()).toBeTruthy();
});
