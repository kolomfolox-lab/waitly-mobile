import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchActiveShifts } from '../../api/shifts';

export default function HeadWaiterDashboard() {
    const { user, logout } = useAuth();
    const [viewMode, setViewMode] = useState('MANAGEMENT'); // MANAGEMENT or WAITER_VIEW
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeWaiters: 0,
        activeChefs: 0,
        totalRevenue: 0,
        totalOrders: 0
    });

    useEffect(() => {
        loadShiftData();
        const interval = setInterval(loadShiftData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const loadShiftData = async () => {
        try {
            const data = await fetchActiveShifts();
            const shiftsArray = data.results || data || [];
            setShifts(shiftsArray);

            // Calculate stats
            const activeShifts = shiftsArray.filter(s => !s.ended_at);
            const activeWaiters = activeShifts.filter(s =>
                s.user?.role === 'WAITER' || s.user?.role === 'HEAD_WAITER'
            ).length;
            const activeChefs = activeShifts.filter(s =>
                s.user?.role === 'CHEF' || s.user?.role === 'COOK'
            ).length;

            const totalRevenue = shiftsArray.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
            const totalOrders = shiftsArray.reduce((sum, s) => sum + (s.orders_count || 0), 0);

            setStats({
                activeWaiters,
                activeChefs,
                totalRevenue,
                totalOrders
            });
        } catch (error) {
            console.error('Failed to load shifts:', error);
            Alert.alert('Error', 'Failed to load staff data');
        } finally {
            setLoading(false);
        }
    };

    const renderShiftItem = ({ item }) => {
        const isActive = !item.ended_at;
        const startTime = new Date(item.started_at).toLocaleTimeString();
        const duration = item.ended_at
            ? Math.round((new Date(item.ended_at) - new Date(item.started_at)) / (1000 * 60 * 60))
            : Math.round((new Date() - new Date(item.started_at)) / (1000 * 60 * 60));

        return (
            <View style={[styles.shiftCard, isActive && styles.activeShiftCard]}>
                <View style={styles.shiftHeader}>
                    <Text style={styles.staffName}>{item.user?.full_name || 'Unknown'}</Text>
                    <View style={[styles.statusIndicator, { backgroundColor: isActive ? '#2ECC71' : '#95A5A6' }]} />
                </View>
                <Text style={styles.shiftRole}>{item.user?.role || 'N/A'}</Text>
                <View style={styles.shiftDetails}>
                    <Text style={styles.shiftLabel}>Started: {startTime}</Text>
                    <Text style={styles.shiftLabel}>Duration: {duration}h</Text>
                </View>
                {isActive && (
                    <View style={styles.shiftStats}>
                        <Text style={styles.statText}>Orders: {item.orders_count || 0}</Text>
                        <Text style={styles.statText}>Sales: ${parseFloat(item.total_amount || 0).toFixed(2)}</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manager Dashboard</Text>
                <TouchableOpacity onPress={logout}>
                    <Text style={styles.logout}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Revenue Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Today's Revenue</Text>
                    <Text style={styles.bigNumber}>${stats.totalRevenue.toFixed(2)}</Text>
                    <Text style={styles.subText}>{stats.totalOrders} orders completed</Text>
                </View>

                {/* Active Staff Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Active Staff</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Waiters:</Text>
                        <Text style={styles.val}>{stats.activeWaiters}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Chefs:</Text>
                        <Text style={styles.val}>{stats.activeChefs}</Text>
                    </View>
                </View>

                {/* Staff Attendance Section */}
                <Text style={styles.sectionTitle}>Staff Shifts</Text>
                <View style={styles.shiftsContainer}>
                    <FlatList
                        data={shifts}
                        renderItem={renderShiftItem}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No shifts today</Text>
                            </View>
                        }
                    />
                </View>

                {/* Quick Actions */}
                <TouchableOpacity style={styles.actionBtn} onPress={loadShiftData}>
                    <Text style={styles.actionText}>Refresh Data</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#FFF',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    logout: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        padding: 24,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        color: '#95A5A6',
        marginBottom: 8,
    },
    bigNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    subText: {
        color: '#2ECC71',
        marginTop: 4,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    label: {
        fontSize: 16,
        color: '#2C3E50',
    },
    val: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginTop: 8,
        marginBottom: 12,
    },
    shiftsContainer: {
        marginBottom: 16,
    },
    shiftCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#95A5A6',
    },
    activeShiftCard: {
        borderLeftColor: '#2ECC71',
    },
    shiftHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    staffName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C3E50',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    shiftRole: {
        fontSize: 14,
        color: '#95A5A6',
        marginBottom: 8,
    },
    shiftDetails: {
        marginBottom: 8,
    },
    shiftLabel: {
        fontSize: 12,
        color: '#7F8C8D',
        marginBottom: 4,
    },
    shiftStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ECF0F1',
    },
    statText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2C3E50',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#95A5A6',
        fontSize: 16,
    },
    actionBtn: {
        backgroundColor: '#2C3E50',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
