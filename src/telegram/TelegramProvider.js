import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Storage from '../utils/storage';

const TelegramContext = createContext(null);

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }) {
  const [telegramUser, setTelegramUser] = useState(null);
  const [initData, setInitData] = useState('');
  const [colorScheme, setColorScheme] = useState('light');
  const [theme, setTheme] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);
  const [startParam, setStartParam] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsReady(true);
      return;
    }

    try {
      const WebApp = require('@twa-dev/sdk').default;
      if (WebApp && WebApp.initDataUnsafe) {
        setIsTelegramEnv(true);
        setInitData(WebApp.initData || '');
        setTelegramUser(WebApp.initDataUnsafe.user || null);
        setStartParam(WebApp.initDataUnsafe.start_param || WebApp.initDataUnsafe.startapp || '');
        setColorScheme(WebApp.colorScheme || 'light');
        setTheme(WebApp.themeParams || {});

        WebApp.ready();
        WebApp.expand();

        WebApp.onEvent('themeChanged', () => {
          setColorScheme(WebApp.colorScheme || 'light');
          setTheme(WebApp.themeParams || {});
        });
      }
    } catch (e) {
      console.log('Not in Telegram environment:', e.message);
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
    }}>
      {children}
    </TelegramContext.Provider>
  );
}
