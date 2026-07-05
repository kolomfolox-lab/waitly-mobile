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

const ISSUE_PRIORITY = {
    HIGH: { label: 'Высокий', color: COLORS.danger, icon: 'priority-high' },
    MEDIUM: { label: 'Средний', color: COLORS.warning, icon: 'warning' },
    LOW: { label: 'Низкий', color: COLORS.textMuted, icon: 'info' },
};

export default function SupportDashboard({ navigation }) {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [ordersRes, reviewsRes] = await Promise.all([
                client.get('/api/orders/', {
                    params: { status: 'CREATED,CANCELLED,ISSUE' }
                }).catch(() => null),
                client.get('/api/reviews/', {
                    params: { rating__lt: 3 }
                }).catch(() => null),
            ]);
            if (ordersRes?.data) {
                const data = ordersRes.data.results || ordersRes.data || [];
                setOrders(Array.isArray(data) ? data : []);
            }
            if (reviewsRes?.data) {
                const data = reviewsRes.data.results || reviewsRes.data || [];
                setReviews(Array.isArray(data) ? data : []);
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

    const flaggedOrders = orders.filter(o => o.status === 'ISSUE' || o.status === 'CANCELLED');
    const negativeReviews = reviews.filter(r => Number(r.rating) < 3);

    const totalIssues = flaggedOrders.length + negativeReviews.length;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Support</Text>
                    <Text style={styles.subtitle}>Панель поддержки</Text>
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
                    <Text style={styles.title}>Support</Text>
                    <Text style={styles.subtitle}>Панель поддержки</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={[styles.statCard, totalIssues > 0 && { borderColor: COLORS.danger, borderWidth: 1 }]}>
                        <Text style={[styles.statValue, totalIssues > 0 && { color: COLORS.danger }]}>{totalIssues}</Text>
                        <Text style={styles.statLabel}>Требуют внимания</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{flaggedOrders.length}</Text>
                        <Text style={styles.statLabel}>Проблемных заказов</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{negativeReviews.length}</Text>
                        <Text style={styles.statLabel}>Негативных отзывов</Text>
                    </View>
                </View>

                {totalIssues > 0 && (
                    <View style={styles.alertBanner}>
                        <MaterialIcons name="notifications-active" size={20} color={COLORS.white} />
                        <Text style={styles.alertText}>Обнаружены проблемы, требующие внимания</Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>Флаги заказов</Text>
                {flaggedOrders.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="check-circle" size={48} color={COLORS.success} />
                        <Text style={styles.emptyText}>Проблемных заказов нет</Text>
                    </View>
                ) : flaggedOrders.map(order => (
                    <View key={order.id} style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialIcons
                                name={order.status === 'ISSUE' ? 'error' : 'cancel'}
                                size={20}
                                color={order.status === 'ISSUE' ? COLORS.warning : COLORS.danger}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Заказ #{order.id}</Text>
                                <Text style={styles.cardSub}>Стол: {order.table?.number || '—'} &middot; {order.total_amount ? Number(order.total_amount).toLocaleString() + ' UZS' : ''}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: (order.status === 'ISSUE' ? COLORS.warning : COLORS.danger) + '20' }]}>
                                <Text style={[styles.badgeText, { color: order.status === 'ISSUE' ? COLORS.warning : COLORS.danger }]}>
                                    {order.status === 'ISSUE' ? 'Проблема' : 'Отменён'}
                                </Text>
                            </View>
                        </View>
                        {order.issue_description && (
                            <Text style={styles.issueDesc}>{order.issue_description}</Text>
                        )}
                        <TouchableOpacity style={styles.actionBtn}>
                            <MaterialIcons name="visibility" size={16} color={COLORS.white} />
                            <Text style={styles.actionText}>Просмотреть</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                <Text style={styles.sectionTitle}>Негативные отзывы</Text>
                {negativeReviews.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <MaterialIcons name="star" size={48} color={COLORS.success} />
                        <Text style={styles.emptyText}>Негативных отзывов нет</Text>
                    </View>
                ) : negativeReviews.map(review => (
                    <View key={review.id} style={styles.card}>
                        <View style={styles.cardRow}>
                            <MaterialIcons name="rate-review" size={20} color={COLORS.danger} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{review.user?.full_name || 'Гость'}</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <MaterialIcons
                                            key={i}
                                            name={i <= Number(review.rating) ? 'star' : 'star-border'}
                                            size={14}
                                            color={i <= Number(review.rating) ? COLORS.warning : COLORS.textMuted}
                                        />
                                    ))}
                                </View>
                            </View>
                            <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                        </View>
                        {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                        <TouchableOpacity style={styles.actionBtn}>
                            <MaterialIcons name="reply" size={16} color={COLORS.white} />
                            <Text style={styles.actionText}>Ответить</Text>
                        </TouchableOpacity>
                    </View>
                ))}
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
    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
    statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    statValue: { fontSize: 24, fontWeight: '800', color: COLORS.textDark },
    statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
    alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.danger, marginHorizontal: 16, padding: 14, borderRadius: 14, marginBottom: 16 },
    alertText: { color: COLORS.white, fontWeight: '700', fontSize: 13, flex: 1 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, flex: 1 },
    cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    issueDesc: { fontSize: 13, color: COLORS.textDark, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.slate100 },
    starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
    reviewDate: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
    reviewComment: { fontSize: 13, color: COLORS.textDark, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.slate100, lineHeight: 18 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start' },
    actionText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
    emptyCard: { alignItems: 'center', padding: 40, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, marginTop: 10 },
});
