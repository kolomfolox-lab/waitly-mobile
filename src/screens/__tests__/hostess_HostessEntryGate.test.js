import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import { renderScreen } from '../../test/testUtils';

const mockTelegramAuth = jest.fn();
const mockTelegramLink = jest.fn();
const mockRequestContact = jest.fn();
const mockLogin = jest.fn();
const mockTelegramEnv = { current: true };

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    role: null,
    loading: false,
    telegramAuth: mockTelegramAuth,
    telegramLink: mockTelegramLink,
    login: mockLogin,
    logout: jest.fn(),
  }),
}));
jest.mock('../../telegram/TelegramProvider', () => ({
  useTelegram: () => ({
    telegramUser: { id: 123 },
    initData: 'test-init-data',
    isTelegramEnv: mockTelegramEnv.current,
    isReady: true,
    startParam: 'hostess_today',
    requestContact: mockRequestContact,
  }),
}));

import Screen from '../hostess/HostessEntryGate';

const flush = async (times = 3) => {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(200);
    });
  }
};

beforeEach(() => {
  mockTelegramAuth.mockReset();
  mockTelegramLink.mockReset();
  mockRequestContact.mockReset();
  mockLogin.mockReset();
  mockTelegramEnv.current = true;
});

test('hostess entry unlinked telegram goes to error with password path', async () => {
  mockTelegramAuth.mockResolvedValue({ needsPhoneLink: true, initData: 'x' });
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  expect(mockTelegramAuth).toHaveBeenCalledWith('test-init-data');
  expect(view.getByText(/не привязан ни к одному аккаунту/)).toBeTruthy();
  expect(view.getByText('Войти по номеру и паролю')).toBeTruthy();
});

test('hostess entry shows error when login throws', async () => {
  mockTelegramAuth.mockRejectedValue(new Error('bad'));
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  expect(view.getByText(/Не удалось войти/)).toBeTruthy();
  expect(view.getByText('Войти по номеру и паролю')).toBeTruthy();
  expect(view.getByText('Продолжить с Telegram')).toBeTruthy();
});

test('hostess entry opens invite registration from credentials', async () => {
  mockTelegramAuth.mockRejectedValue(new Error('bad'));
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Войти по номеру и паролю'));
  });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Регистрация по инвайту'));
  });
  await flush();
  expect(view.getByText('Код приглашения')).toBeTruthy();
});

test('hostess entry Telegram share logs in', async () => {
  mockTelegramAuth.mockRejectedValueOnce(new Error('bad'));
  mockTelegramAuth.mockResolvedValue(true);
  mockRequestContact.mockResolvedValue(true);
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Продолжить с Telegram'));
  });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Поделиться номером'));
  });
  await flush();
  expect(mockRequestContact).toHaveBeenCalled();
  expect(mockTelegramAuth).toHaveBeenCalledWith('test-init-data');
  expect(view.queryByText('Кто вы?')).toBeNull();
});

test('hostess entry share declined falls back to error with password path', async () => {
  mockTelegramAuth.mockRejectedValue(new Error('bad'));
  mockRequestContact.mockResolvedValue(false);
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Продолжить с Telegram'));
  });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Поделиться номером'));
  });
  await flush();
  expect(view.queryByText('Кто вы?')).toBeNull();
  expect(view.getByText('Войти по номеру и паролю')).toBeTruthy();
});

test('error inside Telegram hides open-bot button', async () => {
  mockTelegramAuth.mockRejectedValue(new Error('bad'));
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  expect(view.getByText('Telegram без данных')).toBeTruthy();
  expect(view.queryByText('Открыть work-бота')).toBeNull();
  expect(view.getByText('Войти по номеру и паролю')).toBeTruthy();
});

test('error outside Telegram shows open-bot button', async () => {
  mockTelegramEnv.current = false;
  mockTelegramAuth.mockRejectedValue(new Error('bad'));
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  expect(view.getByText('Откройте из Telegram')).toBeTruthy();
  expect(view.getByText('Открыть work-бота')).toBeTruthy();
});

test('hostess entry reports guest account instead of dead end', async () => {
  mockTelegramAuth.mockRejectedValue(new Error('bad'));
  mockLogin.mockResolvedValue({ role: 'GUEST', phone_number: '+998994097016' });
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Войти по номеру и паролю'));
  });
  await flush();
  await act(async () => {
    fireEvent.changeText(view.getByPlaceholderText('+998901234567'), '+998994097016');
    fireEvent.changeText(view.getByPlaceholderText('Пароль'), 'secret123');
  });
  await act(async () => {
    fireEvent.press(view.getAllByText('Войти')[0]);
  });
  await flush();
  expect(mockLogin).toHaveBeenCalledWith('+998994097016', 'secret123');
  expect(view.getByText('Номер найден, но это гость')).toBeTruthy();
});

test('hostess entry shows inline error for short number', async () => {
  mockTelegramAuth.mockRejectedValue(new Error('bad'));
  const view = renderScreen(Screen, { initialParams: {} });
  await flush();
  await act(async () => {
    fireEvent.press(view.getByText('Войти по номеру и паролю'));
  });
  await flush();
  await act(async () => {
    fireEvent.changeText(view.getByPlaceholderText('+998901234567'), '+99');
  });
  await act(async () => {
    fireEvent.press(view.getAllByText('Войти')[0]);
  });
  await flush();
  expect(view.getByText(/Введите номер и пароль/)).toBeTruthy();
  expect(mockLogin).not.toHaveBeenCalled();
});
