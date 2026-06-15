import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Storage from './src/utils/storage';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { TelegramProvider } from './src/telegram/TelegramProvider';
import AppNavigator from './src/navigation/AppNavigator';
import i18n from './src/i18n';

export default function App() {
  useEffect(() => {
    const restoreLanguage = async () => {
      try {
        const savedLanguage = await Storage.getItem('app_language');
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Failed to restore language:', error.message);
      }
    };

    restoreLanguage();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NavigationBar.setBackgroundColorAsync('#ffffff').catch(() => {});
    NavigationBar.setButtonStyleAsync('dark').catch(() => {});
    NavigationBar.setStyle('dark');
  }, []);

  return (
    <TelegramProvider>
      <AuthProvider>
        <NotificationsProvider>
          <StatusBar style="dark" backgroundColor="#ffffff" />
          <AppNavigator />
        </NotificationsProvider>
      </AuthProvider>
    </TelegramProvider>
  );
}
