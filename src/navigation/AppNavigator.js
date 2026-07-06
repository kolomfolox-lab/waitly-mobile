import React from 'react';
import { View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import { KitchenProvider } from '../context/KitchenContext';
import LoginScreen from '../screens/common/LoginScreen';
import LinkPhoneScreen from '../screens/common/LinkPhoneScreen';
import SubscriptionExpiredScreen from '../screens/common/SubscriptionExpiredScreen';
import UnauthorizedRoleScreen from '../screens/common/UnauthorizedRoleScreen';

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

// Kitchen
import KitchenDashboard from '../screens/kitchen/KitchenDashboard';
import ChefDashboard from '../screens/chef/ChefDashboard';
import AssignedOrdersScreen from '../screens/kitchen/AssignedOrdersScreen';
import AvailableOrdersScreen from '../screens/kitchen/AvailableOrdersScreen';
import KitchenOrderDetailsScreen from '../screens/kitchen/KitchenOrderDetailsScreen';
import KitchenDelayScreen from '../screens/kitchen/KitchenDelayScreen';
import KitchenAvailabilityScreen from '../screens/kitchen/KitchenAvailabilityScreen';
import KitchenUpdatesScreen from '../screens/kitchen/KitchenUpdatesScreen';
import MenuManagementScreen from '../screens/kitchen/MenuManagementScreen';

// Head Waiter
import HeadWaiterDashboard from '../screens/head_waiter/HeadWaiterDashboard';
import StaffManagementScreen from '../screens/head_waiter/StaffManagementScreen';

// Bartender
import BarDashboard from '../screens/bartender/BarDashboard';
import BarOrderDetailsScreen from '../screens/bartender/BarOrderDetailsScreen';

// Courier
import CourierDashboard from '../screens/courier/CourierDashboard';
import CourierOrderDetailsScreen from '../screens/courier/CourierOrderDetailsScreen';

// Owner
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import StaffScreen from '../screens/owner/StaffScreen';
import OwnerMenuScreen from '../screens/owner/OwnerMenuScreen';
import InventoryScreen from '../screens/InventoryScreen';

// Shift Leader
import ShiftLeaderDashboard from '../screens/shiftleader/ShiftLeaderDashboard';

// Dispatcher
import DispatcherDashboard from '../screens/dispatcher/DispatcherDashboard';

// Accountant
import AccountantDashboard from '../screens/accountant/AccountantDashboard';

// Marketer
import MarketerDashboard from '../screens/marketer/MarketerDashboard';

// Analyst
import AnalystDashboard from '../screens/analyst/AnalystDashboard';

// Support
import SupportDashboard from '../screens/support/SupportDashboard';

// Auditor
import AuditorDashboard from '../screens/auditor/AuditorDashboard';

// Supplier
import SupplierDashboard from '../screens/supplier/SupplierDashboard';

// Guest
import GuestScannerScreen from '../screens/guest/GuestScannerScreen';
import GuestMenuScreen from '../screens/guest/GuestMenuScreen';
import GuestCartScreen from '../screens/guest/GuestCartScreen';
import GuestOrderTrackingScreen from '../screens/guest/GuestOrderTrackingScreen';
import GuestPaymentScreen from '../screens/guest/GuestPaymentScreen';
import GuestProfileScreen from '../screens/guest/GuestProfileScreen';

// Guest Cart
import { CartProvider } from '../context/CartContext';

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
    'KitchenOrderDetails',
    'KitchenDelayAction',
    'KitchenAvailability',
    'KitchenUpdates',
    'KitchenMenuManagement',
    'BarOrderDetails',
    'CourierOrderDetails',
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
            <Stack.Screen name="KitchenUpdates" component={KitchenUpdatesScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
    );
}

function KitchenQueueStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="KitchenHome" component={KitchenDashboard} />
            <Stack.Screen name="KitchenOrderDetails" component={KitchenOrderDetailsScreen} />
            <Stack.Screen name="KitchenDelayAction" component={KitchenDelayScreen} />
            <Stack.Screen name="KitchenAvailability" component={KitchenAvailabilityScreen} />
            <Stack.Screen name="KitchenUpdates" component={KitchenUpdatesScreen} />
            <Stack.Screen name="KitchenMenuManagement" component={MenuManagementScreen} />
        </Stack.Navigator>
    );
}

function AssignedOrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AssignedOrdersHome" component={AssignedOrdersScreen} />
            <Stack.Screen name="KitchenOrderDetails" component={KitchenOrderDetailsScreen} />
            <Stack.Screen name="KitchenDelayAction" component={KitchenDelayScreen} />
            <Stack.Screen name="KitchenAvailability" component={KitchenAvailabilityScreen} />
            <Stack.Screen name="KitchenUpdates" component={KitchenUpdatesScreen} />
        </Stack.Navigator>
    );
}

function AvailableOrdersStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AvailableOrdersHome" component={AvailableOrdersScreen} />
            <Stack.Screen name="KitchenOrderDetails" component={KitchenOrderDetailsScreen} />
            <Stack.Screen name="KitchenDelayAction" component={KitchenDelayScreen} />
            <Stack.Screen name="KitchenAvailability" component={KitchenAvailabilityScreen} />
            <Stack.Screen name="KitchenUpdates" component={KitchenUpdatesScreen} />
        </Stack.Navigator>
    );
}

function ChefMenuStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChefMenuHome" component={MenuManagementScreen} />
            <Stack.Screen name="KitchenAvailability" component={KitchenAvailabilityScreen} />
            <Stack.Screen name="KitchenUpdates" component={KitchenUpdatesScreen} />
        </Stack.Navigator>
    );
}

function WaiterTabs() {
    const { unreadCount } = useNotifications();
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                HomeTab: 'home',
                TablesTab: 'table-restaurant',
                OrdersTab: 'receipt-long',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="HomeTab" component={WaiterDashboardStack} options={{ tabBarLabel: t('tab_home') }} />
            <Tab.Screen name="TablesTab" component={WaiterTablesStack} options={{ tabBarLabel: t('tab_tables') }} />
            <Tab.Screen name="OrdersTab" component={WaiterOrdersStack} options={{ tabBarLabel: t('tab_orders') }} />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: t('tab_profile'),
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: COLORS.primary, color: COLORS.white },
                }}
            />
        </Tab.Navigator>
    );
}

function HeadWaiterDashboardStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HeadWaiterHome" component={HeadWaiterDashboard} />
            <Stack.Screen name="OrderCreation" component={OrderCreationScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ gestureEnabled: false }} />
        </Stack.Navigator>
    );
}

function HeadWaiterStaffStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="StaffManageHome" component={StaffManagementScreen} />
        </Stack.Navigator>
    );
}

function HeadWaiterTabs() {
    const { unreadCount } = useNotifications();
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                HomeTab: 'assignment-turned-in',
                StaffTab: 'people',
                OrdersTab: 'receipt-long',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="HomeTab" component={HeadWaiterDashboardStack} options={{ tabBarLabel: 'Смена' }} />
            <Tab.Screen name="StaffTab" component={HeadWaiterStaffStack} options={{ tabBarLabel: 'Персонал' }} />
            <Tab.Screen name="OrdersTab" component={WaiterOrdersStack} options={{ tabBarLabel: t('tab_orders') }} />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: t('tab_profile'),
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: COLORS.primary, color: COLORS.white },
                }}
            />
        </Tab.Navigator>
    );
}

function KitchenTabsInner() {
    const { user } = useAuth();
    const isChefOrHeadChef = user?.role === 'CHEF' || user?.role === 'HEAD_CHEF';
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                QueueTab: 'outdoor-grill',
                AssignedTab: 'assignment-ind',
                AvailableTab: 'playlist-add-check',
                MenuTab: 'restaurant-menu',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="QueueTab" component={KitchenQueueStack} options={{ tabBarLabel: t('tab_queue') }} />
            <Tab.Screen name="AssignedTab" component={AssignedOrdersStack} options={{ tabBarLabel: t('tab_assigned') }} />
            <Tab.Screen name="AvailableTab" component={AvailableOrdersStack} options={{ tabBarLabel: t('tab_available') }} />
            {isChefOrHeadChef ? (
                <Tab.Screen name="MenuTab" component={ChefMenuStack} options={{ tabBarLabel: t('tab_menu') }} />
            ) : null}
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function KitchenTabs() {
    return (
        <KitchenProvider>
            <KitchenTabsInner />
        </KitchenProvider>
    );
}

function BarQueueStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="BarHome" component={BarDashboard} />
            <Stack.Screen name="BarOrderDetails" component={BarOrderDetailsScreen} />
        </Stack.Navigator>
    );
}

function BartenderTabsInner() {
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                QueueTab: 'local-bar',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="QueueTab" component={BarQueueStack} options={{ tabBarLabel: t('tab_queue') }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function BartenderTabs() {
    return (
        <KitchenProvider>
            <BartenderTabsInner />
        </KitchenProvider>
    );
}

function CourierDeliveryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="CourierHome" component={CourierDashboard} />
            <Stack.Screen name="CourierOrderDetails" component={CourierOrderDetailsScreen} />
        </Stack.Navigator>
    );
}

function CourierTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                DeliveriesTab: 'motorcycle',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="DeliveriesTab" component={CourierDeliveryStack} options={{ tabBarLabel: 'Доставки' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function OwnerTabs() {
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                StatsTab: 'bar-chart',
                StaffTab: 'people',
                OwnerMenuTab: 'restaurant-menu',
                InventoryTab: 'inventory',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="StatsTab" component={OwnerDashboard} options={{ tabBarLabel: 'Статистика' }} />
            <Tab.Screen name="StaffTab" component={StaffScreen} options={{ tabBarLabel: 'Персонал' }} />
            <Tab.Screen name="OwnerMenuTab" component={OwnerMenuScreen} options={{ tabBarLabel: 'Меню' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Профиль' }} />
            <Tab.Screen name="InventoryTab" component={InventoryScreen} options={{ tabBarLabel: 'Склад' }} />
        </Tab.Navigator>
    );
}

function SingleTabNavigator({ DashboardComponent, icon, label }) {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                MainTab: icon,
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="MainTab" component={DashboardComponent} options={{ tabBarLabel: label }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function ShiftLeaderTabs() {
    return <SingleTabNavigator DashboardComponent={ShiftLeaderDashboard} icon="assignment" label="Смены" />;
}

function DispatcherTabs() {
    return <SingleTabNavigator DashboardComponent={DispatcherDashboard} icon="local-shipping" label="Доставки" />;
}

function AccountantTabs() {
    return <SingleTabNavigator DashboardComponent={AccountantDashboard} icon="account-balance" label="Финансы" />;
}

function MarketerTabs() {
    return <SingleTabNavigator DashboardComponent={MarketerDashboard} icon="campaign" label="Маркетинг" />;
}

function AnalystTabs() {
    return <SingleTabNavigator DashboardComponent={AnalystDashboard} icon="analytics" label="Аналитика" />;
}

function SupportTabs() {
    return <SingleTabNavigator DashboardComponent={SupportDashboard} icon="support-agent" label="Поддержка" />;
}

function AuditorTabs() {
    return <SingleTabNavigator DashboardComponent={AuditorDashboard} icon="fact-check" label="Аудит" />;
}

function SupplierTabs() {
    return <SingleTabNavigator DashboardComponent={SupplierDashboard} icon="inventory-2" label="Поставки" />;
}

function GuestMenuStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GuestMenuHome" component={GuestMenuScreen} />
        </Stack.Navigator>
    );
}

function GuestCartStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GuestCartHome" component={GuestCartScreen} />
            <Stack.Screen name="GuestPayment" component={GuestPaymentScreen} />
            <Stack.Screen name="GuestOrderTracking" component={GuestOrderTrackingScreen} />
        </Stack.Navigator>
    );
}

function GuestOrderStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="GuestOrderHome" component={GuestOrderTrackingScreen} />
        </Stack.Navigator>
    );
}

function GuestTabsInner() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                ScannerTab: 'qr-code-scanner',
                MenuTab: 'restaurant-menu',
                CartTab: 'shopping-cart',
                OrdersTab: 'receipt',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="ScannerTab" component={GuestScannerScreen} options={{ tabBarLabel: 'Стол' }} />
            <Tab.Screen name="MenuTab" component={GuestMenuStack} options={{ tabBarLabel: 'Меню' }} />
            <Tab.Screen name="CartTab" component={GuestCartStack} options={{ tabBarLabel: 'Корзина' }} />
            <Tab.Screen name="OrdersTab" component={GuestOrderStack} options={{ tabBarLabel: 'Заказ' }} />
            <Tab.Screen name="ProfileTab" component={GuestProfileScreen} options={{ tabBarLabel: 'Профиль' }} />
        </Tab.Navigator>
    );
}

function GuestTabs() {
    return (
        <CartProvider>
            <GuestTabsInner />
        </CartProvider>
    );
}

function getRoleComponent(role) {
    switch (role) {
        case 'CHEF':
        case 'COOK':
        case 'HEAD_CHEF':
        case 'KITCHEN_MANAGER':
            return KitchenTabs;
        case 'HEAD_WAITER':
            return HeadWaiterTabs;
        case 'COURIER':
            return CourierTabs;
        case 'BARTENDER':
            return BartenderTabs;
        case 'RESTAURANT_OWNER':
        case 'CHAIN_OWNER':
        case 'SUPER_ADMIN':
        case 'MANAGER':
            return OwnerTabs;
        case 'WAITER':
        case 'HOSTESS':
            return WaiterTabs;
        case 'SHIFT_LEADER':
            return ShiftLeaderTabs;
        case 'DISPATCHER':
            return DispatcherTabs;
        case 'ACCOUNTANT':
            return AccountantTabs;
        case 'MARKETER':
            return MarketerTabs;
        case 'ANALYST':
            return AnalystTabs;
        case 'SUPPORT':
            return SupportTabs;
        case 'AUDITOR':
            return AuditorTabs;
        case 'SUPPLIER':
            return SupplierTabs;
        case 'GUEST':
            return GuestTabs;
        default:
            return null;
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
    const allowKitchenReadOnly = Boolean(user && ['CHEF', 'COOK', 'HEAD_CHEF', 'KITCHEN_MANAGER'].includes(user.role));

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="LinkPhone" component={LinkPhoneScreen} />
                    </>
                ) : subscriptionLock.blocked && !allowKitchenReadOnly ? (
                    <Stack.Screen name="SubscriptionExpired" component={SubscriptionExpiredScreen} />
                ) : MainComponent ? (
                    <Stack.Screen name="MainApp" component={MainComponent} />
                ) : (
                    <Stack.Screen name="UnauthorizedRole" component={UnauthorizedRoleScreen} />
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
