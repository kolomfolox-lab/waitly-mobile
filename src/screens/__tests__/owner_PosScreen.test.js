import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert } from 'react-native';

jest.mock('../../api/apiService', () => ({
    getOwnerStaff: jest.fn(async () => [
        { id: 'u1', full_name: 'Азиза', role: 'WAITER', has_pin: true },
    ]),
    getPosSettings: jest.fn(async () => ({ pin_required: true, pin_policy_fixed: true, pos_url: 'https://pwa.waitly.uz/demo' })),
    getPosCertificates: jest.fn(async () => []),
    createPosCertificate: jest.fn(async () => ({})),
    updatePosSettings: jest.fn(async (p) => p),
    setStaffPin: jest.fn(async () => ({})),
    getPosShift: jest.fn(),
    openPosShift: jest.fn(),
    dropPosShift: jest.fn(),
    closePosShift: jest.fn(),
    createPosPairRequest: jest.fn(),
    getPosPairRequest: jest.fn(),
}));

const api = require('../../api/apiService');
const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
const Stack = createStackNavigator();

import PosScreen from '../owner/PosScreen';

const flush = async (times = 2) => {
    for (let i = 0; i < times; i += 1) {
        await act(async () => {
            await jest.advanceTimersByTimeAsync(400);
        });
    }
};

// Поллинг-ожидание текста: flush() + повторная проверка
const waitForText = async (view, text, tries = 6) => {
    for (let i = 0; i < tries; i += 1) {
        await flush();
        try {
            view.getByText(text);
            return;
        } catch { /* ещё грузится */ }
    }
    view.getByText(text); // последняя попытка — упадёт с понятной ошибкой
};

function renderPos() {
    return render(
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Pos" component={PosScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

beforeEach(() => {
    alertSpy.mockClear();
    api.openPosShift.mockReset();
    api.dropPosShift.mockReset();
    api.closePosShift.mockReset();
    api.createPosPairRequest.mockReset();
    api.getPosPairRequest.mockReset();
    api.getPosShift.mockResolvedValue({ shift: null });
});

test('PosScreen: открытие смены — openPosShift с суммой и алерт успеха', async () => {
    api.openPosShift.mockResolvedValue({ shift: { opening_cash: '50000', expected_cash: '50000', cash_drops: '0' } });
    const view = renderPos();
    await waitForText(view, 'Открыть смену');
    fireEvent.changeText(view.getByPlaceholderText('Начальная сумма (сум)'), '50000');
    fireEvent.press(view.getByText('Открыть смену'));
    await flush();
    expect(api.openPosShift).toHaveBeenCalledWith('50000');
    expect(alertSpy).toHaveBeenCalledWith('Смена открыта', expect.stringMatching(/50[ ,.]?000/));
    // интерфейс перешёл в состояние «смена открыта»
    await waitForText(view, '● Смена открыта');
});

test('PosScreen: ошибка открытия смены — алерт с сообщением сервера (не тихий catch)', async () => {
    api.openPosShift.mockRejectedValue({ response: { data: { error: { code: 'POS_SHIFT_ALREADY_OPEN', message: 'Shift already open' } } } });
    const view = renderPos();
    await waitForText(view, 'Открыть смену');
    fireEvent.changeText(view.getByPlaceholderText('Начальная сумма (сум)'), '50000');
    fireEvent.press(view.getByText('Открыть смену'));
    await flush();
    expect(alertSpy).toHaveBeenCalledWith('Ошибка', 'Shift already open');
});

test('PosScreen: при открытой смене — изъятие и Z-отчёт с расхождением', async () => {
    api.getPosShift.mockResolvedValue({ shift: { opening_cash: '50000', expected_cash: '120000', cash_drops: '10000', difference: '0' } });
    api.dropPosShift.mockResolvedValue({ shift: { opening_cash: '50000', expected_cash: '110000', cash_drops: '20000' } });
    api.closePosShift.mockResolvedValue({ shift: { difference: '-5000' } });
    const view = renderPos();
    await waitForText(view, '● Смена открыта');
    expect(view.getByText(/Начальная сумма: 50[ ,.]?000 сум/)).toBeTruthy();

    fireEvent.changeText(view.getByPlaceholderText('Сумма изъятия (сум)'), '10000');
    fireEvent.press(view.getByText('Изъять наличные'));
    await flush();
    expect(api.dropPosShift).toHaveBeenCalledWith('10000');
    expect(alertSpy).toHaveBeenCalledWith('Изъято', expect.stringMatching(/10[ ,.]?000/));

    fireEvent.changeText(view.getByPlaceholderText('Фактическая сумма в кассе (сум)'), '115000');
    fireEvent.press(view.getByText('Закрыть смену (Z-отчёт)'));
    await flush();
    expect(api.closePosShift).toHaveBeenCalledWith('115000');
    expect(alertSpy).toHaveBeenCalledWith('Z-отчёт · смена закрыта', expect.stringMatching(/-?5[ ,.]?000/));
});

test('PosScreen: обратный Magic Pair — касса генерирует QR и ждёт подтверждения', async () => {
    api.createPosPairRequest.mockResolvedValue({ code: '123456', qr_url: 'https://app.waitly.uz/pos-pair/123456', status: 'waiting', expires_in: 90 });
    const view = renderPos();
    await waitForText(view, 'Показать QR для владельца');
    fireEvent.press(view.getByText('Показать QR для владельца'));
    await flush();
    expect(api.createPosPairRequest).toHaveBeenCalled();
    expect(view.getByText('Код: 123456')).toBeTruthy();
    expect(view.getByText(/Ждём подтверждения/)).toBeTruthy();

    // поллинг: владелец подтвердил → алерт успеха
    api.getPosPairRequest.mockResolvedValue({ status: 'confirmed' });
    await flush(4);
    expect(alertSpy).toHaveBeenCalledWith('Касса подключена', expect.stringContaining('подтвердил'));
});

test('PosScreen: ошибка паринга показывается (не тихий catch)', async () => {
    api.createPosPairRequest.mockRejectedValue({ response: { data: { error: { message: 'Сервер недоступен' } } } });
    const view = renderPos();
    await waitForText(view, 'Показать QR для владельца');
    fireEvent.press(view.getByText('Показать QR для владельца'));
    await flush();
    expect(alertSpy).toHaveBeenCalledWith('Ошибка', 'Сервер недоступен');
});
