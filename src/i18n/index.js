import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import ru from './locales/ru.json';
import uz from './locales/uz.json';
import en from './locales/en.json';

const resources = {
    ru: { translation: ru },
    uz: { translation: uz },
    en: { translation: en },
};

// Get device language safely
const getDeviceLanguage = () => {
    try {
        const locale = Localization.locale || Localization.locales?.[0] || 'ru-RU';
        return locale.split('-')[0];
    } catch (error) {
        return 'ru';
    }
};

i18n
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        resources,
        lng: getDeviceLanguage(), // Get device language safely
        fallbackLng: 'ru', // Default to Russian
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
