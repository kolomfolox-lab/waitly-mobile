import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
    SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { aiChat, aiConfirmAction, aiPendingActions } from '../../api/apiService';

const C = {
    primary: '#ff6b6b', primarySoft: 'rgba(255,107,107,0.12)',
    accent: '#667eea', accentSoft: 'rgba(102,126,234,0.12)',
    bg: '#f8f5f5', card: '#ffffff', border: '#e2e8f0',
    text: '#0f172a', muted: '#94a3b8', success: '#52D681',
    successSoft: 'rgba(82,214,129,0.12)', warning: '#F7B731',
    warningSoft: 'rgba(247,183,49,0.12)',
};

const SUGGESTIONS = [
    'Создай банкет на 15 гостей сегодня в 19:00',
    'Покажи аналитику за последние 7 дней',
    'Что по инвентарю?',
    'Добавь официанта по имени Азиз, телефон +998901234567',
    'Сколько мы заработали за месяц?',
    'Покажи сотрудников ресторана',
];

const STATUS_RU = {
    WAITER: 'Официант', HEAD_WAITER: 'Старший официант', HOSTESS: 'Хостес',
    CHEF: 'Повар', COOK: 'Кухня', HEAD_CHEF: 'Шеф-повар', BARTENDER: 'Бармен',
    SHIFT_LEADER: 'Старший смены', DISPATCHER: 'Диспетчер', COURIER: 'Курьер',
};

function formatRows(tool, detail) {
    if (!detail) return null;
    const R = (title, rows) => ({ title, rows });
    if (tool === 'list_staff') {
        return R('Сотрудники', (detail.staff || []).map(s => ({
            name: s.full_name, value: `${STATUS_RU[s.role] || s.role} · ${s.phone}`,
        })));
    }
    if (tool === 'list_dishes') {
        return R('Блюда', (detail.dishes || []).map(d => ({
            name: d.name, value: `${d.price} сум · ${d.is_available ? 'доступно' : 'нет'}`,
        })));
    }
    if (tool === 'list_tables') {
        return R('Столы', (detail.tables || []).map(t => ({
            name: `Стол ${t.number}`, value: t.is_occupied ? 'Занят' : 'Свободен',
        })));
    }
    if (tool === 'get_inventory') {
        const list = (detail.ingredients || []).slice(0, 15);
        return R('Инвентарь', list.map(i => ({
            name: i.name,
            value: `${i.quantity} ${i.unit} · ${i.status === 'empty' ? 'пусто' : i.status === 'low' ? 'мало' : 'ок'}`,
        })));
    }
    if (tool === 'list_bookings') {
        return R('Брони', (detail.bookings || []).map(b => ({
            name: `Стол ${b.table} · ${b.date} ${b.time}`,
            value: `${b.guests} гостей · ${b.client}`,
        })));
    }
    if (tool === 'list_modules') {
        return R('Модули', (detail.modules || []).map(m => ({
            name: m.name, value: m.is_active ? 'Включён' : 'Выключен',
        })));
    }
    if (tool === 'get_finances' && detail.revenue != null) {
        return R('Финансы', [
            { name: 'Выручка', value: String(detail.revenue) },
            { name: 'Прибыль', value: String(detail.net_profit) },
            { name: 'Фудкост', value: String(detail.food_cost) },
            { name: 'Заказы', value: String(detail.order_count) },
        ]);
    }
    return null;
}

export default function OwnerAIChatScreen() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState(false);
    const [resolving, setResolving] = useState({});
    const listRef = useRef(null);
    const inputRef = useRef(null);

    const scrollBottom = useCallback(() => {
        const raf = globalThis.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
        raf(() => listRef.current?.scrollToEnd({ animated: true }));
    }, []);

    useEffect(() => { scrollBottom(); }, [messages, thinking, scrollBottom]);

    useEffect(() => {
        aiPendingActions().then((res) => {
            const pendings = res?.pending_actions || [];
            if (pendings.length) {
                setMessages(prev => [...prev, {
                    id: `pending-${Date.now()}`, role: 'assistant', content: 'Есть действия, которые ждут вашего подтверждения:',
                    pendings: pendings.map(p => ({ id: p.id, summary: p.summary })),
                }]);
            }
        }).catch(() => {});
    }, []);

    const sendMessage = useCallback(async (text) => {
        const trimmed = (text || '').trim();
        if (!trimmed || thinking) return;
        setInput('');
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: trimmed }]);
        setThinking(true);
        try {
            const history = messages
                .filter(m => m.role !== 'user' || m !== messages[messages.length - 1])
                .slice(-10)
                .map(m => ({ role: m.role, content: m.content }));
            const res = await aiChat({ message: trimmed, history });
            setMessages(prev => [...prev, {
                id: `a-${Date.now()}`, role: 'assistant', content: res.reply, actions: res.actions,
            }]);
        } catch (e) {
            const detail = e?.response?.data?.error;
            setMessages(prev => [...prev, {
                id: `a-${Date.now()}`, role: 'assistant',
                content: detail || 'Не удалось получить ответ от ассистента. Попробуйте ещё раз.',
            }]);
        } finally {
            setThinking(false);
        }
    }, [messages, thinking]);

    const resolvePending = useCallback(async (pendingId, confirm, summary) => {
        if (resolving[pendingId]) return;
        setResolving(prev => ({ ...prev, [pendingId]: 'busy' }));
        try {
            const res = await aiConfirmAction(pendingId, confirm);
            if (res.executed) {
                setMessages(prev => [...prev, {
                    id: `a-${Date.now()}`, role: 'assistant',
                    content: `✅ Действие «${summary}» подтверждено и выполнено.`,
                }]);
            } else if (res.cancelled) {
                setMessages(prev => [...prev, {
                    id: `a-${Date.now()}`, role: 'assistant',
                    content: `Действие «${summary}» отменено.`,
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: `a-${Date.now()}`, role: 'assistant',
                    content: `Не удалось выполнить: ${res.error || 'ошибка'}`,
                }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, {
                id: `a-${Date.now()}`, role: 'assistant',
                content: `Ошибка: ${e?.response?.data?.error || 'попробуйте ещё раз'}`,
            }]);
        } finally {
            setResolving(prev => ({ ...prev, [pendingId]: 'idle' }));
        }
    }, [resolving]);

    const renderBubble = ({ item }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.bubbleRow, isUser ? styles.rowUser : styles.rowAI]}>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
                    <Text style={[styles.bubbleText, isUser && { color: '#fff' }]}>{item.content}</Text>
                    {item.pendings?.length ? item.pendings.map((p) => (
                        <PendingCard key={p.id} pending={p} resolving={resolving[p.id]} onResolve={resolvePending} />
                    )) : null}
                    {item.actions?.length ? (
                        <View style={styles.actions}>
                            {item.actions.map((a, i) => {
                                if (a.pending_action) {
                                    return (
                                        <PendingCard
                                            key={`${i}`}
                                            pending={{ id: a.pending_action.id, summary: a.pending_action.action }}
                                            resolving={resolving[a.pending_action.id]}
                                            onResolve={resolvePending}
                                        />
                                    );
                                }
                                const rows = formatRows(a.tool, a.detail);
                                return (
                                    <View key={`${i}`} style={styles.actionCard}>
                                        <Text style={styles.actionTitle}>{a.summary}</Text>
                                        {a.detail?.error ? <Text style={styles.actionError}>{a.detail.error}</Text> : null}
                                        {rows?.rows.length ? rows.rows.slice(0, 10).map((r, j) => (
                                            <View key={j} style={styles.actionRow}>
                                                <Text style={styles.actionName} numberOfLines={1}>{r.name}</Text>
                                                <Text style={styles.actionValue} numberOfLines={1}>{r.value}</Text>
                                            </View>
                                        )) : null}
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.kicker}>Owner</Text>
                        <Text style={styles.title}>AI Ассистент</Text>
                        <Text style={styles.sub}>{user?.full_name || ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatar} onPress={() => setMessages([])}>
                        <MaterialIcons name="delete-sweep" size={20} color={C.text} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(m) => m.id}
                    renderItem={renderBubble}
                    contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <MaterialIcons name="auto-awesome" size={40} color={C.primary} />
                            <Text style={styles.emptyTitle}>Спросите ассистента</Text>
                            <Text style={styles.emptyText}>
                                Управляйте рестораном через чат: сотрудники, меню, брони, инвентарь, финансы, дизайн QR-меню. Удаления — только с вашей кнопкой.
                            </Text>
                            <View style={styles.chips}>
                                {SUGGESTIONS.map((s) => (
                                    <TouchableOpacity key={s} style={styles.chip} onPress={() => sendMessage(s)}>
                                        <Text style={styles.chipText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    }
                    ListFooterComponent={thinking ? (
                        <View style={styles.thinking}>
                            <ActivityIndicator color={C.primary} />
                            <Text style={styles.thinkingText}>Думаю и выполняю…</Text>
                        </View>
                    ) : null}
                />

                <View style={styles.inputWrap}>
                    <TextInput
                        ref={inputRef}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Например: создай банкет на 20 гостей сегодня в 19:00"
                        placeholderTextColor={C.muted}
                        style={styles.input}
                        multiline
                        onSubmitEditing={() => sendMessage(input)}
                    />
                    <TouchableOpacity
                        style={[styles.send, (!input.trim() || thinking) && { opacity: 0.5 }]}
                        disabled={!input.trim() || thinking}
                        onPress={() => sendMessage(input)}
                    >
                        {thinking ? <ActivityIndicator color="#fff" size="small" /> : <MaterialIcons name="send" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function PendingCard({ pending, resolving, onResolve }) {
    return (
        <View style={styles.pendingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="verified-user" size={16} color={C.warning} />
                <Text style={styles.pendingTitle}>Ждёт подтверждения</Text>
            </View>
            <Text style={styles.pendingDesc}>«{pending.summary}» ещё НЕ выполнено.</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                    style={[styles.pBtn, { backgroundColor: C.success }]}
                    disabled={resolving === 'busy'}
                    onPress={() => onResolve(pending.id, true, pending.summary)}
                >
                    {resolving === 'busy' ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.pBtnText}>Подтвердить</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.pBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border }]}
                    disabled={resolving === 'busy'}
                    onPress={() => onResolve(pending.id, false, pending.summary)}
                >
                    <Text style={[styles.pBtnText, { color: C.text }]}>Отменить</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { paddingHorizontal: 20, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
    kicker: { color: '#8bd8ff', fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
    title: { color: C.text, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
    sub: { color: C.muted, fontSize: 13, marginTop: 2 },
    avatar: { padding: 8, borderRadius: 999, backgroundColor: C.bg },
    bubbleRow: { marginBottom: 12, flexDirection: 'row' },
    rowUser: { justifyContent: 'flex-end' },
    rowAI: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '92%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleUser: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
    bubbleAI: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
    bubbleText: { color: C.text, fontSize: 14, lineHeight: 21 },
    actions: { marginTop: 8, gap: 8 },
    actionCard: { backgroundColor: C.bg, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border },
    actionTitle: { color: C.accent, fontSize: 12, fontWeight: '800', marginBottom: 4 },
    actionError: { color: C.primary, fontSize: 12, marginTop: 2 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    actionName: { color: C.text, fontSize: 12, flex: 1, marginRight: 8, fontWeight: '600' },
    actionValue: { color: C.muted, fontSize: 12 },
    pendingCard: { backgroundColor: C.warningSoft, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(247,183,49,0.35)', marginTop: 8 },
    pendingTitle: { color: '#b8860b', fontSize: 12, fontWeight: '800' },
    pendingDesc: { color: '#7a5c0a', fontSize: 12, marginTop: 4 },
    pBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, alignItems: 'center', minWidth: 110 },
    pBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    emptyWrap: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 10 },
    emptyTitle: { color: C.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
    emptyText: { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 20 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18 },
    chip: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    chipText: { color: C.text, fontSize: 12, fontWeight: '600' },
    thinking: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
    thinkingText: { color: C.muted, fontSize: 13 },
    inputWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, paddingBottom: 20, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
    input: { flex: 1, backgroundColor: C.bg, borderRadius: 18, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, color: C.text, fontSize: 14, maxHeight: 100 },
    send: { backgroundColor: C.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
