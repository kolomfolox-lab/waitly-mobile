/**
 * dialog.js: подтверждения и алерты обязаны работать в TWA,
 * где react-native-web Alert.alert — пустой no-op.
 */
import { Platform } from 'react-native';
import { alertDialog, confirmDialog } from '../dialog';

describe('utils/dialog', () => {
  const realOS = Platform.OS;

  afterEach(() => {
    Platform.OS = realOS;
    delete (global.window || {}).Telegram;
    jest.restoreAllMocks();
  });

  test('confirmDialog on web without Telegram falls back to window.confirm', async () => {
    Platform.OS = 'web';
    global.window = global.window || {};
    delete global.window.Telegram;
    const spy = jest.fn(() => true);
    global.window.confirm = spy;
    await expect(confirmDialog('T?', 'M?', {})).resolves.toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  test('confirmDialog in TWA uses showPopup and resolves by button id', async () => {
    Platform.OS = 'web';
    let popupCb = null;
    global.window = global.window || {};
    global.window.Telegram = {
      WebApp: {
        showPopup: jest.fn((params, cb) => { popupCb = cb; }),
        onEvent: jest.fn(),
        offEvent: jest.fn(),
      },
    };
    const p = confirmDialog('T?', 'M?', { okText: 'Да' });
    expect(global.window.Telegram.WebApp.showPopup).toHaveBeenCalled();
    popupCb('ok');
    await expect(p).resolves.toBe(true);
  });

  test('confirmDialog in TWA cancel returns false', async () => {
    Platform.OS = 'web';
    let popupCb = null;
    global.window = global.window || {};
    global.window.Telegram = {
      WebApp: {
        showPopup: jest.fn((params, cb) => { popupCb = cb; }),
        onEvent: jest.fn(),
        offEvent: jest.fn(),
      },
    };
    const p = confirmDialog('T?', 'M?');
    popupCb('cancel');
    await expect(p).resolves.toBe(false);
  });

  test('alertDialog on web without Telegram falls back to window.alert', async () => {
    Platform.OS = 'web';
    global.window = global.window || {};
    delete global.window.Telegram;
    const spy = jest.fn();
    global.window.alert = spy;
    await alertDialog('T', 'M');
    expect(spy).toHaveBeenCalledWith('T\nM');
  });

  test('alertDialog in TWA uses showAlert', async () => {
    Platform.OS = 'web';
    global.window = global.window || {};
    const showAlert = jest.fn((msg, cb) => cb());
    global.window.Telegram = { WebApp: { showAlert, onEvent: jest.fn(), offEvent: jest.fn() } };
    await alertDialog('T', 'M');
    expect(showAlert).toHaveBeenCalled();
  });
});
