import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

export const mockUser = {
  id: 1,
  role: 'WAITER',
  phone: '+998901234567',
  name: 'Test Waiter',
  first_name: 'Test',
  last_name: 'Waiter',
  username: 'test_waiter',
  restaurant: { id: 1, name: 'Test Restaurant', slug: 'test-restaurant' },
  position: 'Официант',
};

export function createAuthContextMock(overrides = {}) {
  return {
    useAuth: () => ({
      user: mockUser,
      role: mockUser.role,
      loading: false,
      subscriptionLock: {
        blocked: false,
        subscriptionActive: true,
        subscriptionExpiresAt: null,
        subscriptionStatus: 'ACTIVE',
      },
      login: jest.fn(async () => true),
      register: jest.fn(async () => true),
      logout: jest.fn(),
      telegramAuth: jest.fn(async () => ({})),
      telegramLinkPhone: jest.fn(async () => ({})),
      applyUserData: jest.fn(),
      ...overrides,
    }),
    AuthProvider: ({ children }) => children,
  };
}

export function createKitchenContextMock() {
  return {
    useKitchen: () => ({
      activeOrders: [],
      assignedOrders: [],
      availableOrders: [],
      counts: {},
      currentTime: new Date(),
      connectionLabel: 'Live',
      connectionMode: 'realtime',
      delayOrder: jest.fn(),
      detailsCache: {},
      dishes: [],
      filters: {},
      getErrorMessage: () => null,
      getOrderDetails: jest.fn(async () => null),
      kitchenModeLabel: 'Кухня',
      loading: false,
      markUpdatesViewed: jest.fn(),
      pendingActions: {},
      readOnly: false,
      refresh: jest.fn(),
      refreshing: false,
      roleLabel: 'Кухня',
      setDishAvailability: jest.fn(),
      teamMembers: [],
      unreadUpdatesCount: 0,
      takeOrder: jest.fn(),
      startOrder: jest.fn(),
      readyOrder: jest.fn(),
      assignOrder: jest.fn(),
      cancelKitchenOrder: jest.fn(),
    }),
    KitchenProvider: ({ children }) => children,
  };
}

export function createCartContextMock() {
  return {
    useCart: () => ({
      items: [],
      addItem: jest.fn(),
      updateQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      getTotal: () => 0,
      getItemCount: () => 0,
    }),
    CartProvider: ({ children }) => children,
  };
}

export function createNotificationsContextMock() {
  return {
    useNotifications: () => ({
      unreadCount: 0,
      notifications: [],
      settings: { enabled: true, sound: true, vibration: true },
      updateSettings: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      refresh: jest.fn(),
    }),
    NotificationsProvider: ({ children }) => children,
  };
}

export function createTelegramProviderMock() {
  return {
    useTelegram: () => ({
      telegramUser: null,
      initData: '',
      colorScheme: 'light',
      theme: {},
      isReady: true,
      isTelegramEnv: false,
      startParam: '',
      WebApp: null,
      setTelegramUser: jest.fn(),
      setInitData: jest.fn(),
    }),
    TelegramProvider: ({ children }) => children,
  };
}

const Stack = createStackNavigator();

export function renderScreen(Screen, { initialParams = {}, screenName = 'Smoke' } = {}) {
  return render(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={screenName}
          component={Screen}
          initialParams={initialParams}
          options={{ headerShown: false, animation: 'none', animationDuration: 0 }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
