import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, ActivityIndicator,
    RefreshControl, TouchableOpacity, SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const COLORS = {
    primary: '#ff6b6b',
    backgroundLight: '#f8f5f5',
    success: '#52D681',
    warning: '#F7B731',
    danger: '#FF4757',
    white: '#FFFFFF',
    textDark: '#0B1527',
    textMuted: '#8F9BB3',
    slate100: '#F1F5F9',
};

const TABS = [
    { key: 'promo', label: 'Акции', icon: 'local-offer' },
    { key: 'surveys', label: 'Опросы', icon: 'poll' },
    { key: 'loyalty', label: 'Лояльность', icon: 'card-membership' },
];

export default function MarketerDashboard({ navigation }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('promo');
    const [promoCodes, setPromoCodes] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [loyaltyTiers, setLoyaltyTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [promoRes, surveyRes, loyaltyRes] = await Promise.all([
                client.get('/api/marketing/promo-codes/').catch(() => null),
                client.get('/api/marketing/survey-templates/').catch(() => null),
                client.get('/api/crm/loyalty-tiers/').catch(() => null),
            ]);
            if (promoRes?.data) {
                const data = promoRes.data.results || promoRes.data || [];
                setPromoCodes(Array.isArray(data) ? data : []);
            }
            if (surveyRes?.data) {
                const data = surveyRes.data.results || surveyRes.data || [];
                setSurveys(Array.isArray(data) ? data : []);
            }
            if (loyaltyRes?.data) {
                const data = loyaltyRes.data.results || loyaltyRes.data || [];
                setLoyaltyTiers(Array.isArray(data) ? data : []);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    const activePromos = promoCodes.filter(p => p.is_active !== false);

    const renderPromoTab = () => (
        <>
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{activePromos.length}</Text>
                    <Text style={styles.statLabel}>Активные акции</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{promoCodes.length}</Text>
                    <Text style={styles.statLabel}>Всего промокодов</Text>
                </View>
            </View>
            <Text style={styles.sectionTitle}>Промокоды</Text>
            {promoCodes.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="local-offer" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : promoCodes.map(promo => (
                <View key={promo.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <MaterialIcons name="confirmation-number" size={20} color={COLORS.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{promo.code}</Text>
                            <Text style={styles.cardSub}>Скидка: {promo.discount}% &middot; {promo.usage_count || 0} использований</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: promo.is_active !== false ? COLORS.success + '20' : COLORS.textMuted + '20' }]}>
                            <Text style={[styles.badgeText, { color: promo.is_active !== false ? COLORS.success : COLORS.textMuted }]}>
                                {promo.is_active !== false ? 'Активен' : 'Неактивен'}
                            </Text>
                        </View>
                    </View>
                </View>
            ))}
        </>
    );

    const renderSurveysTab = () => (
        <>
            <Text style={styles.sectionTitle}>Шаблоны опросов</Text>
            {surveys.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="poll" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : surveys.map(survey => (
                <View key={survey.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <MaterialIcons name="fact-check" size={20} color={COLORS.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{survey.title || survey.name}</Text>
                            <Text style={styles.cardSub}>Вопросов: {survey.questions?.length || 0} &middot; Статус: {survey.is_active ? 'Активен' : 'Черновик'}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                    </View>
                </View>
            ))}
        </>
    );

    const renderLoyaltyTab = () => (
        <>
            <Text style={styles.sectionTitle}>Уровни лояльности</Text>
            {loyaltyTiers.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="card-membership" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>нет данных</Text>
                </View>
            ) : loyaltyTiers.map(tier => (
                <View key={tier.id} style={styles.card}>
                    <View style={styles.cardRow}>
                        <MaterialIcons
                            name={tier.level === 'GOLD' ? 'star' : tier.level === 'SILVER' ? 'stars' : 'card-giftcard'}
                            size={24}
                            color={tier.level === 'GOLD' ? COLORS.warning : COLORS.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{tier.name || tier.level}</Text>
                            <Text style={styles.cardSub}>Мин. сумма: {Number(tier.min_spent || 0).toLocaleString()} UZS</Text>
                        </View>
                        <View style={styles.tierBadge}>
                            <Text style={styles.tierBadgeText}>{tier.discount || 0}%</Text>
                        </View>
                    </View>
                </View>
            ))}
        </>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Marketer</Text>
                    <Text style={styles.subtitle}>Маркетинговая панель</Text>
                </View>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Marketer</Text>
                    <Text style={styles.subtitle}>Маркетинговая панель</Text>
                </View>

                <View style={styles.tabRow}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <MaterialIcons name={tab.icon} size={16} color={activeTab === tab.key ? COLORS.white : COLORS.textMuted} />
                            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'promo' && renderPromoTab()}
                {activeTab === 'surveys' && renderSurveysTab()}
                {activeTab === 'loyalty' && renderLoyaltyTab()}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundLight },
    scrollContent: { paddingBottom: 60 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: COLORS.textDark },
    subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: COLORS.white },
    tabChipActive: { backgroundColor: COLORS.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
    tabTextActive: { color: COLORS.white },
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
    statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1 },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    tierBadge: { backgroundColor: COLORS.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    tierBadgeText: { fontSize: 13, fontWeight: '800', color: COLORS.warning },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
});
