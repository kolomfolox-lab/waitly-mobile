import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import Storage from './src/utils/storage';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { TelegramProvider } from './src/telegram/TelegramProvider';
import AppNavigator from './src/navigation/AppNavigator';
import i18n from './src/i18n';
import { registerPushToken } from './src/api/apiService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function PushRegistrar({ children }) {
  const { user } = useAuth();
  const navigationRef = useRef();
  const registeredRef = useRef(false);

  useEffect(() => {
    const handleNotificationResponse = (response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.type === 'waiter_call' && data?.table_id) {
        navigationRef.current = data;
      }
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!user || registeredRef.current) return;

    const register = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        await registerPushToken(token, Platform.OS === 'ios' ? 'IOS' : 'ANDROID');
        registeredRef.current = true;
      } catch (e) {
        console.log('Push registration failed:', e.message);
      }
    };

    register();
  }, [user]);

  return children;
}

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
        <PushRegistrar>
          <NotificationsProvider>
            <StatusBar style="dark" backgroundColor="#ffffff" />
            <AppNavigator />
          </NotificationsProvider>
        </PushRegistrar>
      </AuthProvider>
    </TelegramProvider>
  );
}
