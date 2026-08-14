import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../kitchen/MenuManagementScreen';

test('kitchen/MenuManagementScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
