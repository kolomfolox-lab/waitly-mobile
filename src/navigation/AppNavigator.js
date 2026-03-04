import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/common/LoginScreen';
import WaiterDashboard from '../screens/waiter/WaiterDashboard';
import WaiterTables from '../screens/waiter/WaiterTables';
import OrderCreationScreen from '../screens/waiter/OrderCreationScreen';
import OrderConfirmationScreen from '../screens/waiter/OrderConfirmationScreen';
import ChefDashboard from '../screens/chef/ChefDashboard';
import HeadWaiterDashboard from '../screens/head_waiter/HeadWaiterDashboard';
import StaffManagementScreen from '../screens/head_waiter/StaffManagementScreen';
import OwnerDashboard from '../screens/owner/OwnerDashboard';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                    <>
                        {role === 'CHEF' || role === 'COOK' ? (
                            <Stack.Screen name="ChefDashboard" component={ChefDashboard} />
                        ) : role === 'RESTAURANT_OWNER' ? (
                            <>
                                <Stack.Screen name="OwnerDashboard" component={OwnerDashboard} />
                                <Stack.Screen name="Tables" component={WaiterTables} options={{ animationEnabled: false }} />
                                <Stack.Screen name="StaffManagement" component={StaffManagementScreen} options={{ animationEnabled: false }} />
                            </>
                        ) : role === 'HEAD_WAITER' ? (
                            <>
                                <Stack.Screen name="HeadWaiterDashboard" component={HeadWaiterDashboard} />
                                <Stack.Screen name="StaffManagement" component={StaffManagementScreen} options={{ animationEnabled: false }} />
                            </>
                        ) : (
                            <>
                                <Stack.Screen name="WaiterDashboard" component={WaiterDashboard} />
                                <Stack.Screen name="WaiterTables" component={WaiterTables} options={{ animationEnabled: false }} />
                                <Stack.Screen name="OrderCreation" component={OrderCreationScreen} />
                                <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ gestureEnabled: false }} />
                            </>
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
