/* global window */

/**
 * Подпись Telegram из hash URL: клиент дописывает
 * #tgWebAppData=<query>&tgWebAppVersion=...&tgWebAppStartParam=...
 * Тот же формат что WebApp.initData — бэк проверяет одинаково.
 * Нужна когда объект WebApp есть, а initData в нём пустая.
 */
export function readInitDataFromHash() {
  try {
    if (typeof window === 'undefined' || !window.location?.hash) return '';
    const hash = String(window.location.hash).replace(/^#/, '');
    if (!hash.includes('tgWebAppData=')) return '';
    const params = new URLSearchParams(hash);
    // get() уже декодирует %XX — второй decodeURIComponent ломал бы
    // имена со знаком % — отдаём как есть, это формат initData.
    return params.get('tgWebAppData') || '';
  } catch {
    return '';
  }
}

export function readStartParamFromHash() {
  try {
    if (typeof window === 'undefined' || !window.location?.hash) return '';
    const hash = String(window.location.hash).replace(/^#/, '');
    if (!hash.includes('tgWebAppStartParam=')) return '';
    const params = new URLSearchParams(hash);
    return params.get('tgWebAppStartParam') || '';
  } catch {
    return '';
  }
}
