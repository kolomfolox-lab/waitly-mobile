/* global window */
import { Linking } from 'react-native';

/**
 * Открыть t.me-ссылку правильно отовсюду:
 * - внутри Telegram WebView — через WebApp.openTelegramLink (иначе
 *   внешний браузер может не открыться или убить WebView);
 * - снаружи — обычным Linking.
 */
export async function openTelegramLink(url) {
  try {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
      return;
    }
  } catch {
    // ignore → fallback
  }
  await Linking.openURL(url);
}
