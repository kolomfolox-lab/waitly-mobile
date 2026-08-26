import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { Alert } from 'react-native';

jest.mock('../../api/apiService', () => ({
    getCategories: jest.fn(async () => ({ results: [{ id: 'c1', name: 'Кофе' }] })),
    getDishes: jest.fn(async () => ({
        results: [{ id: 'd1', name: 'Капучино', price: '18000', cooking_time: 5, category: 'c1' }],
    })),
    createOrder: jest.fn(),
    getOrders: jest.fn(async () => ({ results: [] })),
}));

const api = require('../../api/apiService');
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const Stack = createStackNavigator();

import OrderCreationScreen from '../waiter/OrderCreationScreen';
import OrderModifyScreen from '../waiter/OrderModifyScreen';

const flush = async () => {
    await act(async () => {
        await jest.advanceTimersByTimeAsync(600);
    });
};

function renderFlow() {
    return render(
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="OrderCreation" component={OrderCreationScreen} initialParams={{ tableNumber: 5, tableId: 't5' }} />
                <Stack.Screen name="OrderModify" component={OrderModifyScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

async function addDishAndOpenCart() {
    const view = renderFlow();
    await flush();
    // меню загрузилось
    await waitFor(() => expect(view.getByText('Капучино')).toBeTruthy());
    // добавить блюдо (плюсик у карточки)
    const addButtons = view.UNSAFE_getAllByProps({ name: 'add' });
    fireEvent.press(addButtons[0]);
    // открыть корзину
    await waitFor(() => expect(view.getByText('Корзина')).toBeTruthy());
    fireEvent.press(view.getByText('Корзина'));
    await waitFor(() => expect(view.getByText('Оформить заказ')).toBeTruthy());
    return view;
}

beforeEach(() => {
    alertSpy.mockClear();
    api.createOrder.mockReset();
    api.getOrders.mockClear();
});

test('409 TABLE_HAS_ACTIVE_ORDER → алерт «Стол занят» + авто-переход на существующий чек', async () => {
    api.createOrder.mockRejectedValue({
        response: { data: { error: { code: 'TABLE_HAS_ACTIVE_ORDER', message: 'Table already has an active order' } } },
    });
    const view = await addDishAndOpenCart();
    fireEvent.press(view.getByText('Оформить заказ'));
    // setTimeout(300) перед submit + промис ошибки
    await flush();
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(
        'Стол занят',
        expect.stringContaining('активный заказ'),
        expect.anything(),
    ));
    // авто-переход: экран OrderModify смонтировался и запросил заказы стола
    await waitFor(() => expect(api.getOrders).toHaveBeenCalledWith({ table: 't5' }));
});

test('другая ошибка создания заказа — обычный алерт об ошибке, без перехода', async () => {
    api.createOrder.mockRejectedValue({
        response: { data: { error: { code: 'INVALID_ORDER_ITEM', message: 'Dish is not available' } } },
    });
    const view = await addDishAndOpenCart();
    fireEvent.press(view.getByText('Оформить заказ'));
    await flush();
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith(
        'Ошибка',
        expect.stringContaining('Dish is not available'),
    ));
    expect(api.getOrders).not.toHaveBeenCalled();
});
