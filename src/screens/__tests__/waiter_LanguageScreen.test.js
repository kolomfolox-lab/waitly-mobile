import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../waiter/LanguageScreen';

test('waiter/LanguageScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {} });
  expect(view.toJSON()).toBeTruthy();
});
