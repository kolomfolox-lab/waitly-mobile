import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/WaiterTipsScreen';

test('waiter/WaiterTipsScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
