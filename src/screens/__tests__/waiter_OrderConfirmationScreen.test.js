import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/OrderConfirmationScreen';

test('waiter/OrderConfirmationScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {"tableNumber":5,"total":120,"items":[],"orderId":"1","orderData":{"id":"1","items":[]}} });
  expect(view.toJSON()).toBeTruthy();
});
