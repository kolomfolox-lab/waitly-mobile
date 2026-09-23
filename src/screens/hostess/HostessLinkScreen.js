import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getWorkBotStatus, requestWorkBotLink } from '../../api/hostess';
import { openTelegramLink } from '../../telegram/openLink';

/**
 * Привязка work-бота ВНУТРИ Web App: хостес жмёт «Подключить» прямо
 * в смене (а не идёт в админку): API даёт ссылку t.me/...?start=CODE →
 * открывается чат бота → Start → возврат сюда → «Проверить».
 */
export default function HostessLinkScreen({ onLinked }) {
    const [busy, setBusy] = useState(false);
    const [botUsername, setBotUsername] = useState('');

    const connect = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const link = await requestWorkBotLink();
            if (link?.bot_username) setBotUsername(link.bot_username);
            if (link?.bot_url) {
                await openTelegramLink(link.bot_url);
            } else {
                Alert.alert('Не получилось', 'Попробуйте позже');
            }
        } catch (e) {
            Alert.alert(
                'Не получилось',
                e?.response?.data?.error || e?.response?.data?.message || 'Попробуйте позже',
            );
        } finally {
            setBusy(false);
        }
    };

    const check = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const st = await getWorkBotStatus();
            if (st?.bot_username) setBotUsername(st.bot_username);
            if (st?.linked) {
                onLinked();
            } else {
                Alert.alert(
                    'Ещё не привязано',
                    'Откройте чат бота, нажмите Start и вернитесь сюда.',
                );
            }
        } catch {
            Alert.alert('Не получилось', 'Нет связи с сервером');
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={styles.wrap}>
            <View style={styles.icon}>
                <MaterialIcons name="telegram" size={44} color="#229ED9" />
            </View>
            <Text style={styles.title}>Подключите work-бот</Text>
            <Text style={styles.text}>
                Смена живёт в Telegram: брони, скан QR и очередь приходят сюда.
                Нажмите «Подключить» — откроется чат бота
                {botUsername ? ` @${botUsername}` : ''}, там жмите Start и возвращайтесь.
            </Text>
            <TouchableOpacity style={styles.primary} onPress={connect} disabled={busy}>
                <Text style={styles.primaryText}>
                    {busy ? 'Секунду…' : 'Подключить'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghost} onPress={check} disabled={busy}>
                <Text style={styles.ghostText}>Я нажал Start — проверить</Text>
            </TouchableOpacity>
            {busy && <ActivityIndicator color="#ff6b6b" style={styles.loader} />}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f5f5', padding: 28, gap: 12 },
    icon: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    title: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
    text: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
    primary: { backgroundColor: '#ff6b6b', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8, width: '100%', alignItems: 'center' },
    primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    ghost: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
    ghostText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },
    loader: { marginTop: 4 },
});
