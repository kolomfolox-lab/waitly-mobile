import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/OrderModifyScreen';

test('waiter/OrderModifyScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {"tableNumber":5,"tableId":"5"} });
  expect(view.toJSON()).toBeTruthy();
});
