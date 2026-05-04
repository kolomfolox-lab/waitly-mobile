export const ORDER_STATUS = {
    CREATED: 'CREATED',
    ACCEPTED: 'ACCEPTED',
    COOKING: 'COOKING',
    READY: 'READY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
};

export const ACTIVE_KITCHEN_STATUSES = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.COOKING,
    ORDER_STATUS.READY,
    ORDER_STATUS.CANCELLED,
];

export const getKitchenAction = (status) => {
    switch (status) {
        case ORDER_STATUS.CREATED:
            return { label: 'Claim', nextStatus: ORDER_STATUS.ACCEPTED, tone: 'primary' };
        case ORDER_STATUS.ACCEPTED:
            return { label: 'Start cooking', nextStatus: ORDER_STATUS.COOKING, tone: 'warning' };
        case ORDER_STATUS.COOKING:
            return { label: 'Ready', nextStatus: ORDER_STATUS.READY, tone: 'success' };
        default:
            return null;
    }
};

export const getStatusLabel = (status) => {
    switch (status) {
        case ORDER_STATUS.CREATED:
            return 'New';
        case ORDER_STATUS.ACCEPTED:
            return 'Claimed';
        case ORDER_STATUS.COOKING:
            return 'Cooking';
        case ORDER_STATUS.READY:
            return 'Ready';
        case ORDER_STATUS.CANCELLED:
            return 'Cancelled';
        default:
            return status || 'Unknown';
    }
};

export const getUrgency = (order) => {
    if (order.status === ORDER_STATUS.CANCELLED) {
        return 'cancelled';
    }

    const createdAt = new Date(order.created_at).getTime();
    if (!createdAt) {
        return 'normal';
    }

    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
    const targetMinutes = Number(order.estimated_time || 15);

    if (elapsedMinutes >= targetMinutes + 5) {
        return 'critical';
    }
    if (elapsedMinutes >= targetMinutes) {
        return 'late';
    }
    if (elapsedMinutes >= Math.max(1, targetMinutes - 5)) {
        return 'warning';
    }
    return 'normal';
};
