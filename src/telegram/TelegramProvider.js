/* global window */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Storage from '../utils/storage';
import { readInitDataFromHash, readStartParamFromHash } from './initData';

/**
 * Полная обёртка Mini Apps JS API для waitly-mobile (персонал + хостес TWA).
 * Источник: scrapped-data/telegram-miniapps/pages/bots--webapps.md (Bot API 6.1–10.1).
 * Вне Telegram (нативный Expo) все методы — безопасные no-op/false.
 */

const TelegramContext = createContext(null);

export const useTelegram = () => useContext(TelegramContext);

function getWebApp() {
  // Прямой инжект Telegram — первичен; @twa-dev/sdk — фолбэк.
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      return window.Telegram.WebApp;
    }
  } catch {
    // ignore
  }
  try {
    const sdk = require('@twa-dev/sdk').default;
    if (sdk && sdk.initDataUnsafe) return sdk;
  } catch {
    // ignore
  }
  return null;
}

function isVersionAtLeast(version) {
  try {
    const WebApp = getWebApp();
    if (!WebApp) return false;
    if (typeof WebApp.isVersionAtLeast === 'function') return WebApp.isVersionAtLeast(version);
    const cur = String(WebApp.version || '6.0').split('.').map((n) => parseInt(n, 10) || 0);
    const need = String(version).split('.').map((n) => parseInt(n, 10) || 0);
    if ((cur[0] || 0) !== (need[0] || 0)) return (cur[0] || 0) > (need[0] || 0);
    return (cur[1] || 0) >= (need[1] || 0);
  } catch {
    return false;
  }
}

const haptic = {
  impact: (style = 'medium') => {
    try { getWebApp()?.HapticFeedback?.impactOccurred?.(style); } catch { /* ignore */ }
  },
  notification: (type = 'success') => {
    try { getWebApp()?.HapticFeedback?.notificationOccurred?.(type); } catch { /* ignore */ }
  },
  selection: () => {
    try { getWebApp()?.HapticFeedback?.selectionChanged?.(); } catch { /* ignore */ }
  },
};

async function cloudGet(key) {
  try {
    const WebApp = getWebApp();
    if (WebApp?.CloudStorage?.getItem) {
      const v = await new Promise((resolve) => {
        let done = false;
        try {
          WebApp.CloudStorage.getItem(key, (_e, val) => { if (!done) { done = true; resolve(val ?? null); } });
        } catch { if (!done) { done = true; resolve(null); } }
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 4000);
      });
      if (typeof v === 'string') return v;
    }
  } catch { /* ignore → Storage */ }
  try { return await Storage.getItem(key); } catch { return null; }
}

async function cloudSet(key, value) {
  try { await Storage.setItem(key, value); } catch { /* ignore */ }
  try {
    const WebApp = getWebApp();
    if (WebApp?.CloudStorage?.setItem) {
      await new Promise((resolve) => {
        try { WebApp.CloudStorage.setItem(key, value, () => resolve()); } catch { resolve(); }
        setTimeout(() => resolve(), 4000);
      });
    }
  } catch { /* ignore */ }
}

async function cloudDel(key) {
  try { await Storage.removeItem(key); } catch { /* ignore */ }
  try {
    const WebApp = getWebApp();
    if (WebApp?.CloudStorage?.removeItem) {
      await new Promise((resolve) => {
        try { WebApp.CloudStorage.removeItem(key, () => resolve()); } catch { resolve(); }
        setTimeout(() => resolve(), 4000);
      });
    }
  } catch { /* ignore */ }
}

export function TelegramProvider({ children }) {
  const [telegramUser, setTelegramUser] = useState(null);
  const [initData, setInitData] = useState('');
  const [colorScheme, setColorScheme] = useState('light');
  const [theme, setTheme] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [startParam, setStartParam] = useState('');
  const [webAppVersion, setWebAppVersion] = useState('');
  const [tgPlatform, setTgPlatform] = useState('');
  const [viewportHeight, setViewportHeight] = useState(null);
  const [safeArea, setSafeArea] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [homeScreenStatus, setHomeScreenStatus] = useState(null);
  const initDataRef = useRef('');
  useEffect(() => { initDataRef.current = initData; }, [initData]);

  // Живое перечитывание подписи: Telegram может отдать initData ПОЗЖЕ
  // (холодный старт WebView, возврат из чата бота). Опрос с пустой подписью —
  // это вечные 401, поэтому gate перед каждым poll берёт свежее значение
  // отсюда, а не из замыкания. Возвращает актуальную initData (может быть '').
  const readLiveInitData = useCallback(() => {
    try {
      if (typeof window === 'undefined') return initDataRef.current;
      const WebApp = getWebApp();
      const live = (WebApp && WebApp.initData) || readInitDataFromHash() || '';
      if (live && live !== initDataRef.current) {
        initDataRef.current = live;
        setInitData(live);
        try {
          const u = WebApp?.initDataUnsafe?.user || null;
          if (u) setTelegramUser(u);
        } catch { /* ignore */ }
      }
      return live || initDataRef.current;
    } catch {
      return initDataRef.current;
    }
  }, []);

  // Поделиться номером через Telegram (кнопка входа): возвращает true,
  // если юзер подтвердил, иначе false. Вне Telegram — всегда false.
  const requestContact = async () => {
    try {
      const WebApp = getWebApp();
      if (!WebApp || typeof WebApp.requestContact !== 'function') return false;
      const shared = await WebApp.requestContact();
      return shared === true;
    } catch {
      return false;
    }
  };

  const readStartParamFromUrl = () => {
    // Кнопка «Открыть смену» ведёт на TWA-URL с ?startapp=hostess_today —
    // у такого открытия нет initData.start_param, читаем query сами.
    try {
      if (typeof window === 'undefined' || !window.location?.search) return '';
      const params = new URLSearchParams(window.location.search);
      return params.get('startapp') || params.get('start_param') || '';
    } catch {
      return '';
    }
  };

  // --- BackButton -----------------------------------------------------------
  const showBackButton = useCallback((onClick) => {
    try {
      const WebApp = getWebApp();
      if (!WebApp?.BackButton || Platform.OS !== 'web') return () => {};
      WebApp.BackButton.show?.();
      const handler = () => onClick();
      WebApp.onEvent?.('backButtonClicked', handler);
      return () => {
        try { WebApp.offEvent?.('backButtonClicked', handler); WebApp.BackButton.hide?.(); } catch { /* ignore */ }
      };
    } catch {
      return () => {};
    }
  }, []);

  const hideBackButton = useCallback(() => {
    try { getWebApp()?.BackButton?.hide?.(); } catch { /* ignore */ }
  }, []);

  // --- BottomButton (ex-MainButton) ------------------------------------------
  const showBottomButton = useCallback((text, onClick, opts = {}) => {
    try {
      const WebApp = getWebApp();
      if (!WebApp || Platform.OS !== 'web') return () => {};
      const btn = WebApp.BottomButton || WebApp.MainButton;
      if (!btn) return () => {};
      try {
        if (text) btn.setText?.(text);
        if (opts.color || opts.textColor) btn.setParams?.({ ...(opts.color ? { color: opts.color } : {}), ...(opts.textColor ? { text_color: opts.textColor } : {}) });
        if (opts.disabled) btn.disable?.(); else btn.enable?.();
        btn.show?.();
      } catch { /* ignore */ }
      const handler = () => onClick();
      WebApp.onEvent?.('mainButtonClicked', handler);
      return () => {
        try { WebApp.offEvent?.('mainButtonClicked', handler); btn.hide?.(); } catch { /* ignore */ }
      };
    } catch {
      return () => {};
    }
  }, []);

  const hideBottomButton = useCallback(() => {
    try {
      const WebApp = getWebApp();
      WebApp?.BottomButton?.hide?.();
      WebApp?.MainButton?.hide?.();
    } catch { /* ignore */ }
  }, []);

  // --- Dialogs (Bot API 6.2+) --------------------------------------------------
  const showAlert = useCallback((message) => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (typeof WebApp?.showAlert === 'function') WebApp.showAlert(message, () => resolve());
      else resolve();
    } catch { resolve(); }
  }), []);

  const showConfirm = useCallback((message) => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (typeof WebApp?.showConfirm === 'function') WebApp.showConfirm(message, (ok) => resolve(ok === true));
      else resolve(false);
    } catch { resolve(false); }
  }), []);

  const showPopup = useCallback((params) => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (typeof WebApp?.showPopup !== 'function') { resolve(null); return; }
      let done = false;
      const finish = (id) => {
        if (done) return; done = true;
        try { WebApp.offEvent?.('popupClosed', onClose); } catch { /* ignore */ }
        resolve(id ?? null);
      };
      const onClose = (e) => finish(e?.button_id ?? null);
      try { WebApp.onEvent?.('popupClosed', onClose); } catch { /* ignore */ }
      WebApp.showPopup({ title: params?.title || '', message: params?.message || '', buttons: params?.buttons || [{ id: 'ok', type: 'ok', text: 'OK' }] }, (id) => finish(id ?? null));
      setTimeout(() => finish(null), 30000);
    } catch { resolve(null); }
  }), []);

  // --- QR scanner (Bot API 6.4+): для HostessScanScreen внутри TWA ---------------
  const canScanQr = useCallback(() => {
    try { return Platform.OS === 'web' && typeof getWebApp()?.showScanQrPopup === 'function'; }
    catch { return false; }
  }, []);

  const scanQr = useCallback(() => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (typeof WebApp?.showScanQrPopup !== 'function') { resolve(null); return; }
      let done = false;
      const finish = (text) => {
        if (done) return; done = true;
        try { WebApp.offEvent?.('qrTextReceived', onText); WebApp.offEvent?.('scanQrPopupClosed', onClosed); WebApp.closeScanQrPopup?.(); } catch { /* ignore */ }
        resolve(text);
      };
      const onText = (e) => finish(String(e?.data || ''));
      const onClosed = () => finish(null);
      try { WebApp.onEvent?.('qrTextReceived', onText); WebApp.onEvent?.('scanQrPopupClosed', onClosed); } catch { /* ignore */ }
      WebApp.showScanQrPopup({ text: 'Наведите камеру на QR брони' });
      setTimeout(() => finish(null), 120000);
    } catch { resolve(null); }
  }), []);

  // --- Closing confirmation / swipes -------------------------------------------
  const setClosingConfirmation = useCallback((enabled) => {
    try {
      if (Platform.OS !== 'web') return;
      if (enabled) getWebApp()?.enableClosingConfirmation?.();
      else getWebApp()?.disableClosingConfirmation?.();
    } catch { /* ignore */ }
  }, []);

  // --- Write access (статусы смены в личку) --------------------------------------
  const requestWriteAccess = useCallback(() => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (Platform.OS !== 'web' || typeof WebApp?.requestWriteAccess !== 'function') { resolve(false); return; }
      let done = false;
      const finish = (ok) => {
        if (done) return; done = true;
        try { WebApp.offEvent?.('writeAccessRequested', onEvent); } catch { /* ignore */ }
        resolve(ok);
      };
      const onEvent = (e) => finish(e?.status === 'allowed');
      try { WebApp.onEvent?.('writeAccessRequested', onEvent); } catch { /* ignore */ }
      WebApp.requestWriteAccess((allowed) => finish(allowed === true));
      setTimeout(() => finish(false), 15000);
    } catch { resolve(false); }
  }), []);

  // --- Location (курьер/хостес, Bot API 8.0 + fallback) -----------------------------
  const requestLocation = useCallback(() => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (Platform.OS === 'web' && isVersionAtLeast('8.0') && typeof WebApp?.LocationManager?.getLocation === 'function') {
        try { WebApp.LocationManager.init?.(); } catch { /* ignore */ }
        WebApp.LocationManager.getLocation((loc) => {
          if (loc && typeof loc.latitude === 'number') resolve(loc);
          else resolve(null);
        });
        setTimeout(() => resolve(null), 15000);
      } else {
        resolve(null);
      }
    } catch { resolve(null); }
  }), []);

  // --- Biometric (смена/PIN, Bot API 7.2+) ------------------------------------------
  const isBiometricAvailable = useCallback(() => {
    try {
      const bm = getWebApp()?.BiometricManager;
      return Platform.OS === 'web' && !!bm && bm.isBiometricAvailable === true;
    } catch { return false; }
  }, []);

  const biometricAuthenticate = useCallback((reason = 'Подтвердите личность') => new Promise((resolve) => {
    try {
      const bm = getWebApp()?.BiometricManager;
      if (Platform.OS !== 'web' || !bm || typeof bm.authenticate !== 'function') { resolve(null); return; }
      try { bm.authenticate({ reason }, (token) => resolve(typeof token === 'string' ? token : null)); }
      catch { resolve(null); }
      setTimeout(() => resolve(null), 30000);
    } catch { resolve(null); }
  }), []);

  // --- Share / files / invoice ------------------------------------------------------
  const shareMessage = useCallback((msgId) => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (Platform.OS === 'web' && typeof WebApp?.shareMessage === 'function') {
        let done = false;
        const finish = (ok) => {
          if (done) return; done = true;
          try { WebApp.offEvent?.('shareMessageSent', onSent); WebApp.offEvent?.('shareMessageFailed', onFailed); } catch { /* ignore */ }
          resolve(ok);
        };
        const onSent = () => finish(true);
        const onFailed = () => finish(false);
        try { WebApp.onEvent?.('shareMessageSent', onSent); WebApp.onEvent?.('shareMessageFailed', onFailed); } catch { /* ignore */ }
        WebApp.shareMessage(msgId, (sent) => finish(sent === true));
        setTimeout(() => finish(false), 60000);
      } else resolve(false);
    } catch { resolve(false); }
  }), []);

  const shareToStory = useCallback((mediaUrl, params) => {
    try {
      if (Platform.OS === 'web' && isVersionAtLeast('7.8')) getWebApp()?.shareToStory?.(mediaUrl, params || {});
    } catch { /* ignore */ }
  }, []);

  const downloadFile = useCallback((url, fileName) => {
    try {
      const WebApp = getWebApp();
      if (Platform.OS === 'web' && isVersionAtLeast('8.0') && typeof WebApp?.downloadFile === 'function') {
        WebApp.downloadFile({ url, file_name: fileName });
      }
    } catch { /* ignore */ }
  }, []);

  const openInvoice = useCallback((url) => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (Platform.OS !== 'web' || typeof WebApp?.openInvoice !== 'function') { resolve(null); return; }
      let done = false;
      const finish = (st) => {
        if (done) return; done = true;
        try { WebApp.offEvent?.('invoiceClosed', onClosed); } catch { /* ignore */ }
        resolve(st ?? null);
      };
      const onClosed = (e) => finish(e?.status || 'closed');
      try { WebApp.onEvent?.('invoiceClosed', onClosed); } catch { /* ignore */ }
      WebApp.openInvoice(url, (st) => finish(st));
      setTimeout(() => finish(null), 300000);
    } catch { resolve(null); }
  }), []);

  const openLink = useCallback((url) => {
    try {
      const WebApp = getWebApp();
      if (Platform.OS === 'web' && typeof WebApp?.openLink === 'function') WebApp.openLink(url);
    } catch { /* ignore */ }
  }, []);

  // --- HomeScreen shortcuts (Bot API 8.0) ----------------------------------------------
  const addToHomeScreen = useCallback(() => {
    try { if (Platform.OS === 'web' && isVersionAtLeast('8.0')) getWebApp()?.addToHomeScreen?.(); } catch { /* ignore */ }
  }, []);

  const checkHomeScreenStatus = useCallback(() => new Promise((resolve) => {
    try {
      const WebApp = getWebApp();
      if (Platform.OS !== 'web' || !isVersionAtLeast('8.0') || typeof WebApp?.checkHomeScreenStatus !== 'function') { resolve(null); return; }
      let done = false;
      const finish = (s) => {
        if (done) return; done = true;
        try { WebApp.offEvent?.('homeScreenChecked', onChecked); } catch { /* ignore */ }
        setHomeScreenStatus(s);
        resolve(s);
      };
      const onChecked = (e) => finish(String(e?.status || ''));
      try { WebApp.onEvent?.('homeScreenChecked', onChecked); } catch { /* ignore */ }
      WebApp.checkHomeScreenStatus((st) => finish(String(st || '')));
      setTimeout(() => finish(null), 10000);
    } catch { resolve(null); }
  }), []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsReady(true);
      return;
    }

    const WebApp = getWebApp();
    if (WebApp && WebApp.initDataUnsafe) {
      try {
        setIsTelegramEnv(true);
        // Подпись живёт в двух местах: объект WebApp и hash URL
        // (#tgWebAppData=...). Берём что есть — бэк проверяет одинаково.
        const fromHash = readInitDataFromHash();
        setInitData(WebApp.initData || fromHash || '');
        setTelegramUser(WebApp.initDataUnsafe.user || null);
        setStartParam(
          WebApp.initDataUnsafe.start_param || WebApp.initDataUnsafe.startapp
          || readStartParamFromUrl() || readStartParamFromHash(),
        );
        setColorScheme(WebApp.colorScheme || 'light');
        setTheme(WebApp.themeParams || {});
        setWebAppVersion(WebApp.version || '');
        setTgPlatform(WebApp.platform || '');
        try { setViewportHeight(WebApp.viewportStableHeight ?? WebApp.viewportHeight ?? null); } catch { /* ignore */ }
        try { setSafeArea(WebApp.safeAreaInset || null); } catch { /* ignore */ }
        try { setIsFullscreen(WebApp.isFullscreen === true); } catch { /* ignore */ }

        if (typeof WebApp.ready === 'function') WebApp.ready();
        if (typeof WebApp.expand === 'function') WebApp.expand();
        try {
          // Фулскрин: занимаем весь экран бота (Bot API 8+, иначе стаб
          // SDK просто шумит в консоль — проверяем версию).
          const major = parseInt(String(WebApp.version || '0').split('.')[0], 10) || 0;
          if (major >= 8 && typeof WebApp.requestFullscreen === 'function') {
            const res = WebApp.requestFullscreen();
            if (res && typeof res.catch === 'function') res.catch(() => {});
          }
        } catch {
          // ignore — expand() уже дал максимум
        }
        try {
          // Красим шапку под приложение, низ — под таббар.
          if (typeof WebApp.disableVerticalSwipes === 'function') WebApp.disableVerticalSwipes();
          if (typeof WebApp.setHeaderColor === 'function') WebApp.setHeaderColor('#f8f5f5');
          if (typeof WebApp.setBackgroundColor === 'function') WebApp.setBackgroundColor('#f8f5f5');
          if (isVersionAtLeast('7.10') && typeof WebApp.setBottomBarColor === 'function') WebApp.setBottomBarColor('#ffffff');
        } catch {
          // ignore — старые клиенты
        }
        if (typeof WebApp.onEvent === 'function') {
          WebApp.onEvent('themeChanged', () => {
            setColorScheme(WebApp.colorScheme || 'light');
            setTheme(WebApp.themeParams || {});
          });
          WebApp.onEvent('viewportChanged', () => {
            try { setViewportHeight(WebApp.viewportStableHeight ?? WebApp.viewportHeight ?? null); } catch { /* ignore */ }
          });
          WebApp.onEvent('safeAreaChanged', () => {
            try { setSafeArea(WebApp.safeAreaInset || null); } catch { /* ignore */ }
          });
          WebApp.onEvent('fullscreenChanged', () => {
            try { setIsFullscreen(WebApp.isFullscreen === true); } catch { /* ignore */ }
          });
        }
      } catch (e) {
        console.log('Telegram WebApp read failed:', e.message);
      }
    } else {
      const fallback = readStartParamFromUrl();
      if (fallback) setStartParam(fallback);
    }

    setIsReady(true);
  }, []);

  return (
    <TelegramContext.Provider value={{
      telegramUser,
      initData,
      colorScheme,
      theme,
      isReady,
      isTelegramEnv,
      startParam,
      webAppVersion,
      tgPlatform,
      requestContact,
      // --- полный Mini Apps API (no-op вне Telegram) ---
      haptic,
      readLiveInitData,
      isVersionAtLeast,
      viewportHeight,
      safeArea,
      isFullscreen,
      homeScreenStatus,
      showBackButton,
      hideBackButton,
      showBottomButton,
      hideBottomButton,
      showAlert,
      showConfirm,
      showPopup,
      canScanQr,
      scanQr,
      setClosingConfirmation,
      requestWriteAccess,
      requestLocation,
      isBiometricAvailable,
      biometricAuthenticate,
      shareMessage,
      shareToStory,
      downloadFile,
      openInvoice,
      openLink,
      addToHomeScreen,
      checkHomeScreenStatus,
      cloudGet,
      cloudSet,
      cloudDel,
    }}>
      {children}
    </TelegramContext.Provider>
  );
}
