import { Vibration } from 'react-native';

export const triggerNewOrderAlert = () => {
    Vibration.vibrate([0, 120, 80, 120]);
};

export const shouldAlertForOrders = (previousIds, nextOrders) => {
    const activeNewOrders = nextOrders.filter((order) => order.status === 'CREATED');
    return activeNewOrders.some((order) => !previousIds.has(order.id));
};
