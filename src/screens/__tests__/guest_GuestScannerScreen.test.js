import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../guest/GuestScannerScreen';

test('guest/GuestScannerScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
