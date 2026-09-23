import axios from 'axios';
import Constants from 'expo-constants';

let cachedBase = null;
let resolving = null;

function metroHost() {
    const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.manifest2?.extra?.expoClient?.hostUri ||
        '';
    const host = String(hostUri).split(':')[0];
    return host || null;
}

function orderedCandidates() {
    const list = [];

    const env = process.env.EXPO_PUBLIC_API_BASE_URL;
    if (env) list.push(env.replace(/\/+$/, ''));

    const fromExtra = Constants.expoConfig?.extra?.apiUrl;
    if (fromExtra) list.push(String(fromExtra).replace(/\/+$/, ''));

    const host = metroHost();
    if (host) list.push(`http://${host}:8000`);

    list.push('https://api.waitly.uz');

    return list;
}

async function testBase(base, ms = 2500) {
    try {
        // Любой HTTP-ответ = сервер доступен (даже 5xx — он живой).
        // Сеть недоступна = таймаут/сеть, только это дисквалифицирует кандидата.
        await axios.get(`${base}/health/`, { timeout: ms });
        return true;
    } catch (err) {
        if (err?.response) return true;
        return false;
    }
}

/**
 * Возвращает первый сервер, который реально отвечает.
 * Порядок: EXPO_PUBLIC_API_BASE_URL → extra.apiUrl (app.json) →
 * хост Metro (откуда грузится бандл) → api.waitly.uz.
 * Результат кэшируется на время сессии.
 */
export function ensureApiBase() {
    if (cachedBase) return Promise.resolve(cachedBase);

    if (!resolving) {
        resolving = (async () => {
            const candidates = orderedCandidates();
            for (const base of candidates) {
                const ok = await testBase(base);
                if (ok) {
                    cachedBase = base;
                    return base;
                }
            }
            cachedBase = candidates[0];
            return cachedBase;
        })();
    }
    return resolving;
}
