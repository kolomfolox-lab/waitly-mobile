import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/WaiterTables';

test('waiter/WaiterTables renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
