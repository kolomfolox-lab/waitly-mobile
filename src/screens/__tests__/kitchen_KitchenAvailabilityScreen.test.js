import React from 'react';
import { renderScreen } from '../../test/testUtils';

jest.mock('../../context/AuthContext', () => require('../../test/testUtils').createAuthContextMock());
jest.mock('../../context/KitchenContext', () => require('../../test/testUtils').createKitchenContextMock());

import Screen from '../kitchen/KitchenAvailabilityScreen';

test('kitchen/KitchenAvailabilityScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {"dishIds":[]} });
  expect(view.toJSON()).toBeTruthy();
});
