import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const COLORS = {
    background: '#ffffff',
    panel: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#64748b',
    accent: '#f97316',
};

export default function UnauthorizedRoleScreen() {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.iconWrap}>
                    <MaterialIcons name="no-accounts" size={42} color={COLORS.accent} />
                </View>
                <Text style={styles.title}>Role not supported here</Text>
                <Text style={styles.subtitle}>
                    {user?.role
                        ? `This mobile workspace does not have a route for ${user.role}.`
                        : 'This account does not have access to the current mobile experience.'}
                </Text>

                <TouchableOpacity style={styles.button} onPress={logout}>
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.panel,
        padding: 28,
        alignItems: 'center',
    },
    iconWrap: {
        width: 84,
        height: 84,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff7ed',
        marginBottom: 20,
    },
    title: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 12,
        color: COLORS.muted,
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    button: {
        marginTop: 22,
        borderRadius: 18,
        backgroundColor: COLORS.accent,
        paddingVertical: 15,
        paddingHorizontal: 18,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff7ed',
        fontSize: 15,
        fontWeight: '800',
    },
});
