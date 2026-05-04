import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, ScrollView, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        loadUser();
        loadTables();
    }, []);

    const loadUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const loadTables = async () => {
        try {
            const response = await api.get('/api/v1/mobile/tables/live/');
            setTables(response.data.tables || []);
        } catch (error) {
            console.error('Error loading tables:', error);
            Alert.alert('Error', 'Failed to load tables');
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        navigation.replace('Login');
    };

    const showTableQR = (table) => {
        setSelectedTable(table);
        setShowQRModal(true);
    };

    const shareQRCode = async () => {
        if (selectedTable) {
            try {
                await Share.share({
                    message: `Table ${selectedTable.number} QR Code: ${selectedTable.guest_url}`,
                    url: selectedTable.guest_url,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        }
    };

    const renderTable = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.tableCard,
                item.is_occupied && styles.tableOccupied
            ]}
            onLongPress={() => showTableQR(item)}
        >
            <View style={styles.tableHeader}>
                <MaterialCommunityIcons
                    name="table-furniture"
                    size={32}
                    color={item.is_occupied ? '#ff6b6b' : '#4CAF50'}
                />
                <View style={styles.tableInfo}>
                    <Text style={styles.tableNumber}>Table {item.number}</Text>
                    <View style={[styles.statusBadge, item.is_occupied && styles.statusOccupied]}>
                        <View style={[styles.statusDot, item.is_occupied && styles.statusDotOccupied]} />
                        <Text style={styles.statusText}>
                            {item.is_occupied ? 'Occupied' : 'Available'}
                        </Text>
                    </View>
                </View>
            </View>

            {item.booking && (
                <View style={styles.bookingInfo}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.bookingText}>
                        Reserved: {new Date(item.booking.booking_time).toLocaleTimeString()}
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.qrButton}
                onPress={() => showTableQR(item)}
            >
                <Ionicons name="qr-code-outline" size={18} color="#667eea" />
                <Text style={styles.qrButtonText}>View QR</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.header}
            >
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={32} color="#fff" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
                        <Text style={styles.userRole}>{user?.role?.replace('_', ' ') || 'Staff'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tables</Text>
                    <TouchableOpacity onPress={loadTables}>
                        <Ionicons name="refresh" size={24} color="#667eea" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={tables}
                    renderItem={renderTable}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.tablesList}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* QR Code Modal */}
            <Modal
                visible={showQRModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowQRModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Table {selectedTable?.number} QR Code
                            </Text>
                            <TouchableOpacity onPress={() => setShowQRModal(false)}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.qrContainer}>
                            <View style={styles.qrPlaceholder}>
                                <Ionicons name="qr-code" size={200} color="#667eea" />
                            </View>
                            <Text style={styles.qrUrl}>{selectedTable?.guest_url}</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={shareQRCode}
                            >
                                <Ionicons name="share-outline" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Share</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    userInfo: {
        flex: 1,
        marginLeft: 15,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    userRole: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 2,
        textTransform: 'capitalize',
    },
    logoutButton: {
        padding: 10,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    tablesList: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    tableCard: {
        flex: 1,
        backgroundColor: '#fff',
        margin: 10,
        padding: 15,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#4CAF50',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tableOccupied: {
        borderColor: '#ff6b6b',
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    tableInfo: {
        marginLeft: 10,
        flex: 1,
    },
    tableNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    statusOccupied: {
        backgroundColor: '#ffebee',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginRight: 5,
    },
    statusDotOccupied: {
        backgroundColor: '#ff6b6b',
    },
    statusText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
    },
    bookingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    bookingText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 5,
    },
    qrButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0ff',
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 10,
    },
    qrButtonText: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    qrContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    qrPlaceholder: {
        width: 250,
        height: 250,
        backgroundColor: '#f5f5f5',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    qrUrl: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#667eea',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
