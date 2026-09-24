/* global window, document */

/**
 * Веб-фикс таббара: React Navigation рисует табы ссылками <a role="tab">,
 * и Chrome/Safari вешают на кликнутый таб штатный синий фокус-квадрат —
 * выглядит как баг дизайна (см. скрины хостес). Убираем дефолт, взамен —
 * аккуратный фокус в цветах приложения. Только web, натив не трогаем.
 */

let injected = false;

export function injectWebTabCss() {
    try {
        if (injected) return;
        if (typeof document === 'undefined') return;
        injected = true;
        const css = [
            'div[role="tablist"] a[role="tab"] { outline: none !important; }',
            'div[role="tablist"] a[role="tab"]:focus-visible {',
            '  outline: 2px solid rgba(255,107,107,.55) !important;',
            '  outline-offset: 2px;',
            '  border-radius: 22px;',
            '}',
            'div[role="tablist"] a[role="tab"]::-moz-focus-inner { border: 0; }',
        ].join('\n');
        const el = document.createElement('style');
        el.setAttribute('data-waitly', 'tabbar-focus-fix');
        el.textContent = css;
        document.head.appendChild(el);
    } catch {
        // ignore — косметика, не ломаем запуск
    }
}
