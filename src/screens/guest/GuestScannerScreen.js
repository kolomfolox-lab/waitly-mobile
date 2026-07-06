import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    primary: '#ff6b6b',
    background: '#f8f5f5',
    white: '#FFFFFF',
    text: '#1a1a2e',
    textMuted: '#94a3b8',
    cardShadow: 'rgba(0,0,0,0.06)',
    border: '#f0ecec',
};

export default function GuestScannerScreen({ navigation }) {
    const [tableNumber, setTableNumber] = useState('');

    const handleManualEntry = () => {
        const num = parseInt(tableNumber, 10);
        if (isNaN(num) || num < 1) {
            return;
        }
        navigation.navigate('GuestMenu', { tableNumber: num });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.scannerFrame}>
                    <View style={styles.cornerTL} />
                    <View style={styles.cornerTR} />
                    <View style={styles.cornerBL} />
                    <View style={styles.cornerBR} />
                    <MaterialIcons name="qr-code-scanner" size={64} color={COLORS.primary} />
                    <Text style={styles.scannerHint}>Наведите камеру на QR-код на столе</Text>
                </View>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>или</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.manualSection}>
                    <Text style={styles.manualTitle}>Введите номер стола</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Номер стола"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="number-pad"
                        value={tableNumber}
                        onChangeText={setTableNumber}
                        maxLength={4}
                    />
                    <TouchableOpacity
                        style={[styles.startButton, (!tableNumber || parseInt(tableNumber, 10) < 1) && styles.startButtonDisabled]}
                        onPress={handleManualEntry}
                        disabled={!tableNumber || parseInt(tableNumber, 10) < 1}
                    >
                        <MaterialIcons name="restaurant" size={20} color={COLORS.white} />
                        <Text style={styles.startButtonText}>Начать</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    scannerFrame: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 24,
        paddingVertical: 48,
        paddingHorizontal: 32,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
        position: 'relative',
    },
    cornerTL: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 24,
        height: 24,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderColor: COLORS.primary,
        borderRadius: 4,
    },
    cornerTR: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 24,
        height: 24,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderColor: COLORS.primary,
        borderRadius: 4,
    },
    cornerBL: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        width: 24,
        height: 24,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderColor: COLORS.primary,
        borderRadius: 4,
    },
    cornerBR: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 24,
        height: 24,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderColor: COLORS.primary,
        borderRadius: 4,
    },
    scannerHint: {
        marginTop: 16,
        fontSize: 15,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 32,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: COLORS.textMuted,
    },
    manualSection: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    manualTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 16,
        gap: 8,
    },
    startButtonDisabled: {
        opacity: 0.5,
    },
    startButtonText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
    },
});
