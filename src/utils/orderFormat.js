export const normalizeOrders = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.results)) {
        return payload.results;
    }
    if (Array.isArray(payload?.orders)) {
        return payload.orders;
    }
    return [];
};

export const formatElapsed = (dateString) => {
    const started = new Date(dateString).getTime();
    if (!started) {
        return '0m';
    }

    const totalMinutes = Math.max(0, Math.floor((Date.now() - started) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

export const formatMoney = (value) => {
    const numeric = Number(value || 0);
    return `${numeric.toLocaleString('ru-RU')} UZS`;
};

export const formatOrderItems = (items = []) => {
    if (!items.length) {
        return 'No items';
    }

    return items
        .map((item) => `${item.quantity}x ${item.dish_name || item.name || 'Dish'}`)
        .join(', ');
};
