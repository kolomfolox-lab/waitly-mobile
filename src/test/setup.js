/* eslint-disable no-undef */
import 'react-native-gesture-handler/jestSetup';

jest.useFakeTimers();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
  isAvailableAsync: jest.fn(async () => true),
  canUseBiometricAuthentication: jest.fn(async () => false),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'ru-RU', languageCode: 'ru' }],
  locale: 'ru-RU',
  locales: ['ru-RU'],
  region: 'RU',
  timezone: 'Asia/Tashkent',
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: { All: 'All', Images: 'Images', Videos: 'Videos' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test-token]' })),
  setNotificationChannelAsync: jest.fn(async () => null),
  getNotificationChannelsAsync: jest.fn(async () => []),
  scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  dismissNotificationAsync: jest.fn(async () => {}),
  setBadgeCountAsync: jest.fn(async () => true),
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(async () => {}),
    Sound: {
      createAsync: jest.fn(async () => ({
        sound: {
          playAsync: jest.fn(async () => ({})),
          pauseAsync: jest.fn(async () => ({})),
          unloadAsync: jest.fn(async () => ({})),
          setOnPlaybackStatusUpdate: jest.fn(),
        },
      })),
    },
  },
  Video: jest.fn(() => null),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'https://api.moonlauncher.org/api/v1',
      },
    },
    appOwnership: 'expo',
    executionEnvironment: 'storeClient',
    platform: { ios: { platform: 'ios' } },
  },
  expoConfig: {
    extra: {
      apiUrl: 'https://api.moonlauncher.org/api/v1',
    },
  },
}));

const mockAxiosInstance = {
  get: jest.fn(async () => ({ data: [] })),
  post: jest.fn(async () => ({ data: {} })),
  put: jest.fn(async () => ({ data: {} })),
  patch: jest.fn(async () => ({ data: {} })),
  delete: jest.fn(async () => ({ data: {} })),
  head: jest.fn(async () => ({ data: {} })),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn(), clear: jest.fn() },
  },
};

jest.mock('axios', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(async () => ({ data: {} })), {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(async () => ({ data: [] })),
    post: jest.fn(async () => ({ data: {} })),
    put: jest.fn(async () => ({ data: {} })),
    patch: jest.fn(async () => ({ data: {} })),
    delete: jest.fn(async () => ({ data: {} })),
    isAxiosError: jest.fn(() => false),
    CancelToken: { source: () => ({ token: {}, cancel: jest.fn() }) },
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const { View, Text } = require('react-native');
  const IconMock = ({ name, size, color, style, ...props }) =>
    require('react').createElement(
      View,
      { style, ...props },
      require('react').createElement(Text, null, name || 'icon')
    );
  return {
    MaterialIcons: IconMock,
    Ionicons: IconMock,
    FontAwesome: IconMock,
    FontAwesome5: IconMock,
    Feather: IconMock,
    AntDesign: IconMock,
    MaterialCommunityIcons: IconMock,
  };
});
