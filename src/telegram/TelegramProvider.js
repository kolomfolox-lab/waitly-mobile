import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import WebApp from '@twa-dev/sdk';
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

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsReady(true);
      return;
    }

    try {
      if (WebApp && WebApp.initDataUnsafe) {
        setIsTelegramEnv(true);
        setInitData(WebApp.initData || '');
        setTelegramUser(WebApp.initDataUnsafe.user || null);
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
      WebApp,
    }}>
      {children}
    </TelegramContext.Provider>
  );
}
