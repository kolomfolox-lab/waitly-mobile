import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/AboutScreen';

test('waiter/AboutScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
