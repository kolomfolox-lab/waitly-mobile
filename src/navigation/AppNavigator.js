import React from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/common/LoginScreen';
import SubscriptionExpiredScreen from '../screens/common/SubscriptionExpiredScreen';

// Waiter
import WaiterDashboard from '../screens/waiter/WaiterDashboard';
import WaiterTables from '../screens/waiter/WaiterTables';
import OrdersListScreen from '../screens/waiter/OrdersListScreen';
import OrderCreationScreen from '../screens/waiter/OrderCreationScreen';
import OrderConfirmationScreen from '../screens/waiter/OrderConfirmationScreen';
import ProfileScreen from '../screens/waiter/ProfileScreen';
import NotificationsScreen from '../screens/waiter/NotificationsScreen';
import LanguageScreen from '../screens/waiter/LanguageScreen';
import AboutScreen from '../screens/waiter/AboutScreen';
import SettingsScreen from '../screens/waiter/SettingsScreen';
import { useNotifications } from '../context/NotificationsContext';

// Kitchen (Chef + Cook)
import KitchenDashboard from '../screens/kitchen/KitchenDashboard';
import MenuManagementScreen from '../screens/kitchen/MenuManagementScreen';

// Owner
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import StaffScreen from '../screens/owner/StaffScreen';
import OwnerMenuScreen from '../screens/owner/OwnerMenuScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
    primary: '#ff6b6b',
    textMuted: '#94a3b8',
    white: '#FFFFFF',
    backgroundLight: '#f8f5f5',
    glassBorder: 'rgba(255,255,255,0.92)',
    glassOverlayTop: 'rgba(255,255,255,0.78)',
    glassOverlayMid: 'rgba(255,255,255,0.38)',
    glassOverlayBottom: 'rgba(255,255,255,0.18)',
    glassActive: 'rgba(255,255,255,0.58)',
};

const TAB_STYLE = {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: 10,
    paddingBottom: 14,
    height: 88,
    elevation: 0,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
};

const LABEL_STYLE = { fontSize: 11, fontWeight: '600', marginTop: 2 };
const TAB_ITEM_STYLE = { paddingTop: 2, marginHorizontal: 4, marginVertical: 4, borderRadius: 24 };
const HIDDEN_TAB_ROUTES = new Set([
    'OrderCreation',
    'OrderConfirmation',
    'Notifications',
    'Language',
    'About',
    'Settings',
]);

function GlassTabBackground() {
    return (
        <View style={styles.tabBackgroundShell}>
            <BlurView
                tint={Platform.OS === 'ios' ? 'systemChromeMaterialLight' : 'light'}
                intensity={Platform.OS === 'ios' ? 100 : 72}
                blurMethod={Platform.OS === 'android' ? 'none' : undefined}
                style={StyleSheet.absoluteFill}
            />
            <LinearGradient
                colors={[COLORS.glassOverlayTop, COLORS.glassOverlayMid, COLORS.glassOverlayBottom]}
                locations={[0, 0.42, 1]}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.tabInnerShine} />
        </View>
    );
}

const getTabBarStyleForRoute = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) || route.name;
    if (HIDDEN_TAB_ROUTES.has(routeName)) {
        return { display: 'none' };
    }
    return TAB_STYLE;
};

const buildTabScreenOptions = (icons) => ({ route }) => ({
    headerShown: false,
    tabBarIcon: ({ color }) => (
        <MaterialIcons name={icons[route.name]} size={24} color={color} />
    ),
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.textMuted,
    tabBarStyle: getTabBarStyleForRoute(route),
    tabBarLabelStyle: LABEL_STYLE,
    tabBarItemStyle: TAB_ITEM_STYLE,
    tabBarBackground: () => <GlassTabBackground />,
    tabBarActiveBackgroundColor: COLORS.glassActive,
});

// ========== Waiter Stacks ==========
function WaiterDashboardStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DashboardHome" component={WaiterDashboard} />
            <Stack.Screen name="OrderCreation" component={OrderCreationScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ gestureEnabled: false }} />
        </Stack.Navigator>
    );
}

function WaiterTablesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TablesHome" component={WaiterTables} />
            <Stack.Screen name="OrderCreation" component={OrderCreationScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ gestureEnabled: false }} />
        </Stack.Navigator>
    );
}

function WaiterOrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="OrdersHome" component={OrdersListScreen} />
        </Stack.Navigator>
    );
}

function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileHome" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
    );
}

// ========== Waiter Tabs ==========
function WaiterTabs() {
    const { unreadCount } = useNotifications();

    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                HomeTab: 'home',
                TablesTab: 'table-restaurant',
                OrdersTab: 'receipt-long',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="HomeTab" component={WaiterDashboardStack} options={{ tabBarLabel: 'Главная' }} />
            <Tab.Screen name="TablesTab" component={WaiterTablesStack} options={{ tabBarLabel: 'Столы' }} />
            <Tab.Screen name="OrdersTab" component={WaiterOrdersStack} options={{ tabBarLabel: 'Заказы' }} />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: 'Профиль',
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: COLORS.primary, color: COLORS.white },
                }}
            />
        </Tab.Navigator>
    );
}

// ========== Kitchen Tabs (Chef + Cook) ==========
function KitchenTabs() {
    const { user } = useAuth();
    const isChef = user?.role === 'CHEF';

    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                KitchenTab: 'outdoor-grill',
                MenuTab: 'restaurant-menu',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="KitchenTab" component={KitchenDashboard} options={{ tabBarLabel: 'Кухня' }} />
            {isChef && (
                <Tab.Screen name="MenuTab" component={MenuManagementScreen} options={{ tabBarLabel: 'Меню' }} />
            )}
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Профиль' }} />
        </Tab.Navigator>
    );
}

// ========== Owner Tabs ==========
function OwnerTabs() {
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                StatsTab: 'bar-chart',
                StaffTab: 'people',
                OwnerMenuTab: 'restaurant-menu',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="StatsTab" component={OwnerDashboard} options={{ tabBarLabel: 'Статистика' }} />
            <Tab.Screen name="StaffTab" component={StaffScreen} options={{ tabBarLabel: 'Персонал' }} />
            <Tab.Screen name="OwnerMenuTab" component={OwnerMenuScreen} options={{ tabBarLabel: 'Меню' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Профиль' }} />
        </Tab.Navigator>
    );
}

// ========== Role Router ==========
function getRoleComponent(role) {
    switch (role) {
        case 'CHEF':
        case 'COOK':
            return KitchenTabs;
        case 'RESTAURANT_OWNER':
        case 'CHAIN_OWNER':
        case 'SUPER_ADMIN':
            return OwnerTabs;
        case 'WAITER':
        case 'HEAD_WAITER':
        case 'HOSTESS':
        default:
            return WaiterTabs;
    }
}

export default function AppNavigator() {
    const { user, loading, subscriptionLock } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundLight }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const MainComponent = user ? getRoleComponent(user.role) : null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : subscriptionLock.blocked ? (
                    <Stack.Screen name="SubscriptionExpired" component={SubscriptionExpiredScreen} />
                ) : (
                    <Stack.Screen name="MainApp" component={MainComponent} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    tabBackgroundShell: {
        flex: 1,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    tabInnerShine: {
        position: 'absolute',
        top: 1,
        left: 16,
        right: 16,
        height: 16,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.56)',
        opacity: 0.7,
    },
});
