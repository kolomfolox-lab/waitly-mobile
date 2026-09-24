import React, { useEffect, useRef, useState } from 'react';
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
import { useTelegram } from '../telegram/TelegramProvider';
import GuestWebApp from '../screens/guest/GuestWebApp';

const Stack = createStackNavigator();
import LoginScreen from '../screens/common/LoginScreen';
import AuthScreen from '../screens/common/AuthScreen';
import RegisterScreen from '../screens/common/RegisterScreen';
import LoginTelegramScreen from '../screens/common/LoginTelegramScreen';
import LinkPhoneScreen from '../screens/common/LinkPhoneScreen';
import SubscriptionExpiredScreen from '../screens/common/SubscriptionExpiredScreen';
import UnauthorizedRoleScreen from '../screens/common/UnauthorizedRoleScreen';

// Waiter
import WaiterDashboard from '../screens/waiter/WaiterDashboard';
import WaiterTables from '../screens/waiter/WaiterTables';
import OrdersListScreen from '../screens/waiter/OrdersListScreen';
import OrderCreationScreen from '../screens/waiter/OrderCreationScreen';
import OrderConfirmationScreen from '../screens/waiter/OrderConfirmationScreen';
import OrderModifyScreen from '../screens/waiter/OrderModifyScreen';
import ProfileScreen from '../screens/waiter/ProfileScreen';
import NotificationsScreen from '../screens/waiter/NotificationsScreen';
import LanguageScreen from '../screens/waiter/LanguageScreen';
import AboutScreen from '../screens/waiter/AboutScreen';
import SettingsScreen from '../screens/waiter/SettingsScreen';
import { useNotifications } from '../context/NotificationsContext';

// Kitchen
import KitchenDashboard from '../screens/kitchen/KitchenDashboard';
import AssignedOrdersScreen from '../screens/kitchen/AssignedOrdersScreen';
import AvailableOrdersScreen from '../screens/kitchen/AvailableOrdersScreen';
import KitchenOrderDetailsScreen from '../screens/kitchen/KitchenOrderDetailsScreen';
import KitchenDelayScreen from '../screens/kitchen/KitchenDelayScreen';
import KitchenAvailabilityScreen from '../screens/kitchen/KitchenAvailabilityScreen';
import KitchenUpdatesScreen from '../screens/kitchen/KitchenUpdatesScreen';
import MenuManagementScreen from '../screens/kitchen/MenuManagementScreen';

// Bartender
import BarDashboard from '../screens/bartender/BarDashboard';
import BarOrderDetailsScreen from '../screens/bartender/BarOrderDetailsScreen';

// Barista
import BaristaDashboard from '../screens/barista/BaristaDashboard';

// Courier
import CourierDashboard from '../screens/courier/CourierDashboard';
import CourierOrderDetailsScreen from '../screens/courier/CourierOrderDetailsScreen';

// Dispatcher
import DispatcherDashboard from '../screens/dispatcher/DispatcherDashboard';

// Support
import SupportDashboard from '../screens/support/SupportDashboard';

// Supplier
import SupplierDashboard from '../screens/supplier/SupplierDashboard';

// Auditor
import AuditorDashboard from '../screens/auditor/AuditorDashboard';

// Analyst
import AnalystDashboard from '../screens/analyst/AnalystDashboard';

// Accountant
import AccountantDashboard from '../screens/accountant/AccountantDashboard';

// Marketer
import MarketerDashboard from '../screens/marketer/MarketerDashboard';

// Owner
import OwnerDashboard from '../screens/owner/OwnerDashboard';
import StaffScreen from '../screens/owner/StaffScreen';
import OwnerMenuScreen from '../screens/owner/OwnerMenuScreen';
import OwnerAIChatScreen from '../screens/owner/OwnerAIChatScreen';
import PosScreen from '../screens/owner/PosScreen';
import InventoryScreen from '../screens/InventoryScreen';

// Hostess
import HostessTodayScreen from '../screens/hostess/HostessTodayScreen';
import HostessScanScreen from '../screens/hostess/HostessScanScreen';
import HostessHallScreen from '../screens/hostess/HostessHallScreen';
import HostessEntryGate from '../screens/hostess/HostessEntryGate';
import HostessLinkScreen from '../screens/hostess/HostessLinkScreen';
import { getWorkBotStatus } from '../api/hostess';

// Chef
import ChefDashboard from '../screens/chef/ChefDashboard';
import ChecklistScreen from '../screens/chef/ChecklistScreen';
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
// Web: сплошной бар вместо стекла — backdrop-blur в браузере/TWA мажет
// цвета контента под баром (розовые разводы) и выглядит багом.
const WEB_TAB_STYLE = {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0ecec',
    height: 78,
    paddingTop: 8,
    paddingBottom: 14,
    elevation: 0,
};
const WEB_TAB_ACTIVE_BG = 'rgba(255,107,107,0.12)';
// Вход через work-бот — для ВСЕХ ролей персонала (не только хостес).
// Гостей (GUEST) сюда не пускаем — им гостевое приложение.
const isStaffRoleForBotEntry = (role) => Boolean(role) && role !== 'GUEST';
// Префиксы стартов смены: hostess_* (исторический) и staff_*.
const isShiftStartParam = (value) => {
    const s = String(value || '');
    return s.startsWith('hostess') || s.startsWith('staff');
};
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

const buildTabScreenOptions = (icons) => ({ route }) => {
    const hidden = HIDDEN_TAB_ROUTES.has(getFocusedRouteNameFromRoute(route) || route.name);
    const isWeb = Platform.OS === 'web';
    return {
        headerShown: false,
        tabBarIcon: ({ color }) => (
            <MaterialIcons name={icons[route.name]} size={24} color={color} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: hidden ? { display: 'none' } : (isWeb ? WEB_TAB_STYLE : getTabBarStyleForRoute(route)),
        tabBarLabelStyle: LABEL_STYLE,
        tabBarItemStyle: TAB_ITEM_STYLE,
        tabBarBackground: isWeb ? undefined : () => <GlassTabBackground />,
        tabBarActiveBackgroundColor: isWeb ? WEB_TAB_ACTIVE_BG : COLORS.glassActive,
    };
};

function WaiterDashboardStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DashboardHome" component={WaiterDashboard} />
            <Stack.Screen name="OrderCreation" component={OrderCreationScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="OrderModify" component={OrderModifyScreen} />
        </Stack.Navigator>
    );
}

function WaiterTablesStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TablesHome" component={WaiterTables} />
            <Stack.Screen name="OrderCreation" component={OrderCreationScreen} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ gestureEnabled: false }} />
            <Stack.Screen name="OrderModify" component={OrderModifyScreen} />
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
            <Stack.Screen name="ChefDashboard" component={ChefDashboard} />
            <Stack.Screen name="ChecklistScreen" component={ChecklistScreen} />
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

function HostessTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                HostessTodayTab: 'event',
                HostessScanTab: 'qr-code-scanner',
                HostessHallTab: 'table-restaurant',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="HostessTodayTab" component={HostessTodayScreen} options={{ tabBarLabel: t('tab_today') }} />
            <Tab.Screen name="HostessScanTab" component={HostessScanScreen} options={{ tabBarLabel: t('tab_scan') }} />
            <Tab.Screen name="HostessHallTab" component={HostessHallScreen} options={{ tabBarLabel: t('tab_hall') }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function ChecklistStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ChecklistHome" component={ChecklistScreen} />
        </Stack.Navigator>
    );
}

function KitchenTabsInner() {
    const { user } = useAuth();
    const isChef = user?.role === 'CHEF';
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                QueueTab: 'outdoor-grill',
                AssignedTab: 'assignment-ind',
                AvailableTab: 'playlist-add-check',
                ChecklistTab: 'checklist',
                MenuTab: 'restaurant-menu',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="QueueTab" component={KitchenQueueStack} options={{ tabBarLabel: t('tab_queue') }} />
            <Tab.Screen name="AssignedTab" component={AssignedOrdersStack} options={{ tabBarLabel: t('tab_assigned') }} />
            <Tab.Screen name="AvailableTab" component={AvailableOrdersStack} options={{ tabBarLabel: t('tab_available') }} />
            <Tab.Screen name="ChecklistTab" component={ChecklistStack} options={{ tabBarLabel: 'Чек-листы' }} />
            {isChef ? (
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
            <Tab.Screen name="DeliveriesTab" component={CourierDeliveryStack} options={{ tabBarLabel: 'Deliveries' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function BaristaCoffeeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="BaristaHome" component={BaristaDashboard} />
        </Stack.Navigator>
    );
}

function BaristaTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                OrdersTab: 'coffee',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="OrdersTab" component={BaristaCoffeeStack} options={{ tabBarLabel: '☕ Заказы' }} />
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
                PosTab: 'point-of-sale',
                AiTab: 'auto-awesome',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="StatsTab" component={OwnerDashboard} options={{ tabBarLabel: 'Кабинет' }} />
            <Tab.Screen name="AiTab" component={OwnerAIChatScreen} options={{ tabBarLabel: 'AI' }} />
            <Tab.Screen name="StaffTab" component={StaffScreen} options={{ tabBarLabel: 'Персонал' }} />
            <Tab.Screen name="OwnerMenuTab" component={OwnerMenuScreen} options={{ tabBarLabel: 'Меню' }} />
            <Tab.Screen name="PosTab" component={PosScreen} options={{ tabBarLabel: 'Касса' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Профиль' }} />
            <Tab.Screen name="InventoryTab" component={InventoryScreen} options={{ tabBarLabel: 'Склад' }} />
        </Tab.Navigator>
    );
}

function DispatcherDeliveryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DispatcherHome" component={DispatcherDashboard} />
        </Stack.Navigator>
    );
}

function DispatcherTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                DispatcherTab: 'local-shipping',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="DispatcherTab" component={DispatcherDeliveryStack} options={{ tabBarLabel: 'Диспетчер' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function SupportStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SupportHome" component={SupportDashboard} />
        </Stack.Navigator>
    );
}

function SupportTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                SupportTab: 'support-agent',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="SupportTab" component={SupportStack} options={{ tabBarLabel: 'Поддержка' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function SupplierStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SupplierHome" component={SupplierDashboard} />
        </Stack.Navigator>
    );
}

function SupplierTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                SupplierTab: 'store',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="SupplierTab" component={SupplierStack} options={{ tabBarLabel: 'Поставки' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function AuditorStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AuditorHome" component={AuditorDashboard} />
        </Stack.Navigator>
    );
}

function AuditorTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                AuditorTab: 'verified-user',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="AuditorTab" component={AuditorStack} options={{ tabBarLabel: 'Аудит' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function AnalystStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AnalystHome" component={AnalystDashboard} />
        </Stack.Navigator>
    );
}

function AnalystTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                AnalystTab: 'insights',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="AnalystTab" component={AnalystStack} options={{ tabBarLabel: 'Аналитика' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function AccountantStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AccountantHome" component={AccountantDashboard} />
        </Stack.Navigator>
    );
}

function AccountantTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                AccountantTab: 'account-balance-wallet',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="AccountantTab" component={AccountantStack} options={{ tabBarLabel: 'Финансы' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function MarketerStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MarketerHome" component={MarketerDashboard} />
        </Stack.Navigator>
    );
}

function MarketerTabs() {
    const { t } = useTranslation();
    return (
        <Tab.Navigator
            screenOptions={buildTabScreenOptions({
                MarketerTab: 'campaign',
                ProfileTab: 'person',
            })}
        >
            <Tab.Screen name="MarketerTab" component={MarketerStack} options={{ tabBarLabel: 'Маркетинг' }} />
            <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: t('tab_profile') }} />
        </Tab.Navigator>
    );
}

function getRoleComponent(role) {
    switch (role) {
        case 'CHEF':
        case 'COOK':
        case 'HEAD_CHEF':
        case 'KITCHEN_MANAGER':
            return KitchenTabs;
        case 'COURIER':
            return CourierTabs;
        case 'DISPATCHER':
            return DispatcherTabs;
        case 'BARTENDER':
            return BartenderTabs;
        case 'BARISTA':
            return BaristaTabs;
        case 'RESTAURANT_OWNER':
        case 'CHAIN_OWNER':
        case 'SUPER_ADMIN':
        case 'MANAGER':
            return OwnerTabs;
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
        case 'WAITER':
        case 'HEAD_WAITER':
        case 'SHIFT_LEADER':
            return WaiterTabs;
        case 'HOSTESS':
            return HostessTabs;
        default:
            return null;
    }
}

export default function AppNavigator() {
    const { user, loading, subscriptionLock } = useAuth();
    const { isReady: telegramReady, startParam, isTelegramEnv, showBackButton } = useTelegram();
    const [wbLink, setWbLink] = useState(null);
    // Telegram BackButton ↔ React Navigation: внутри TWA нативная кнопка
    // «назад» дублирует стек навигации (Bot API BackButton).
    const navRef = useRef(null);
    const backCleanupRef = useRef(null);
    const syncTelegramBack = () => {
        try {
            if (Platform.OS !== 'web' || !isTelegramEnv || typeof showBackButton !== 'function') return;
            const canGoBack = !!(navRef.current && navRef.current.canGoBack && navRef.current.canGoBack());
            if (backCleanupRef.current) {
                try { backCleanupRef.current(); } catch { /* ignore */ }
                backCleanupRef.current = null;
            }
            if (canGoBack) {
                backCleanupRef.current = showBackButton(() => {
                    try {
                        if (navRef.current?.canGoBack?.()) navRef.current.goBack();
                    } catch { /* ignore */ }
                });
            }
        } catch { /* ignore */ }
    };
    useEffect(() => () => {
        try { if (backCleanupRef.current) backCleanupRef.current(); } catch { /* ignore */ }
    }, []);

    // The web build is the guest-facing Telegram mini app. Native builds keep
    // the existing staff and kitchen navigation below.
    // Staff TWA entry: work-bot opens this build with startapp=hostess_*/staff_* —
    // gate quietly logs in via initData, then role routing takes over.
    // Это для ВСЕХ ролей: дальше каждый падает на свои табы по роли.
    const cameFromStaffEntry =
        Platform.OS === 'web' && isShiftStartParam(startParam);
    const isHostessEntry = cameFromStaffEntry && !user;
    const isGuestWebApp = Platform.OS === 'web' && !user && !isHostessEntry;

    // Привязка work-бота — ВНУТРИ Web App: персонал, зашедший через
    // кнопку «Открыть смену», видит экран подключения прямо в смене.
    // Native-приложение не трогаем; при ошибке API — не блокируем.
    useEffect(() => {
        let active = true;
        if (!cameFromStaffEntry || !user || !isStaffRoleForBotEntry(user.role)) {
            if (active) setWbLink(null);
            return () => { active = false; };
        }
        setWbLink((prev) => (prev === 'ok' ? prev : 'checking'));
        getWorkBotStatus()
            .then((st) => { if (active) setWbLink(st?.linked ? 'ok' : 'required'); })
            .catch(() => { if (active) setWbLink('ok'); });
        return () => { active = false; };
    }, [cameFromStaffEntry, user]);

    if (loading || !telegramReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundLight }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (isGuestWebApp) {
        return <GuestWebApp />;
    }

    if (isHostessEntry) {
        return <HostessEntryGate />;
    }

    if (wbLink === 'checking') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.backgroundLight }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (wbLink === 'required') {
        return <HostessLinkScreen onLinked={() => setWbLink('ok')} />;
    }

    const MainComponent = user ? getRoleComponent(user.role) : null;
    const allowKitchenReadOnly = Boolean(user && ['CHEF', 'COOK', 'HEAD_CHEF', 'KITCHEN_MANAGER'].includes(user.role));

    return (
        <NavigationContainer ref={navRef} onStateChange={syncTelegramBack} onReady={syncTelegramBack}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Auth" component={AuthScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="LoginTelegram" component={LoginTelegramScreen} />
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
