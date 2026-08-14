import React from 'react';
import { renderScreen } from '../../test/testUtils';


import Screen from '../courier/CourierOrderDetailsScreen';

test('courier/CourierOrderDetailsScreen renders', () => {
  const view = renderScreen(Screen, { initialParams: {"orderId":"1"} });
  expect(view.toJSON()).toBeTruthy();
});
