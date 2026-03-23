import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import AppNavigator from './src/navigation/AppNavigator';
import i18n from './src/i18n';

export default function App() {
  useEffect(() => {
    const restoreLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('app_language');
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

    NavigationBar.setStyle('dark');
  }, []);

  return (
    <AuthProvider>
      <NotificationsProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </NotificationsProvider>
    </AuthProvider>
  );
}
