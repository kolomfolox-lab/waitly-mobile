export const KITCHEN_ROLES = new Set(['CHEF', 'COOK', 'HEAD_CHEF', 'KITCHEN_MANAGER', 'BARTENDER']);

export const KITCHEN_ROLE_LABELS = {
    CHEF: 'Chef',
    COOK: 'Cook',
    HEAD_CHEF: 'Head Chef',
    KITCHEN_MANAGER: 'Kitchen Manager',
    BARTENDER: 'Bartender',
};

export const KITCHEN_HOME_FILTERS = [
    { key: 'NEW', label: 'New' },
    { key: 'MINE', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'READY', label: 'Ready' },
    { key: 'DELAYED', label: 'Delayed' },
];

export const KITCHEN_UPDATE_TYPES = {
    CREATED: 'order.created',
    UPDATED: 'order.updated',
    READY: 'order.ready',
    DELAY: 'order.delay_added',
    CLOSED: 'order.closed',
};

export const normalizeListResponse = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.results)) {
        return payload.results;
    }
    return [];
};

export const getOrderId = (order) => order?.id || order?.uuid || order?.order_id;

export const getOrderShortCode = (order) => {
    const id = String(getOrderId(order) || '');
    if (!id) return 'Order';
    return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
};

export const getOrderTableLabel = (order) => (
    order?.table_number ||
    order?.table?.number ||
    order?.table_label ||
    'No table'
);

export const getOrderCreatedAt = (order) => (
    order?.created_at ||
    order?.accepted_at ||
    order?.updated_at ||
    null
);

export const getElapsedMinutes = (order, now = Date.now()) => {
    const createdAt = getOrderCreatedAt(order);
    if (!createdAt) return 0;
    const diff = Math.max(0, now - new Date(createdAt).getTime());
    return Math.floor(diff / 60000);
};

export const getOrderEtaMinutes = (order) => {
    const base = Number(order?.estimated_time || 0);
    const extra = Number(order?.extra_time || 0);
    return Math.max(0, base + extra);
};

export const getDelayMinutes = (order) => Math.max(0, Number(order?.extra_time || 0));

export const isOrderDelayed = (order, now = Date.now()) => {
    if (getDelayMinutes(order) > 0) return true;
    const eta = getOrderEtaMinutes(order);
    return eta > 0 && getElapsedMinutes(order, now) > eta;
};

export const getOrderDishCount = (order) => (
    (order?.items || []).reduce((sum, item) => sum + Number(item?.quantity || 0), 0)
);

export const getOrderNotes = (order) => {
    const notes = (order?.items || [])
        .map((item) => item?.notes || item?.comment || '')
        .filter(Boolean)
        .map((value) => value.trim());

    return [...new Set(notes)];
};

export const formatMinutes = (minutes) => {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (!hrs) return `${mins}m`;
    if (!mins) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
};

export const formatKitchenTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getUrgencyLevel = (order, now = Date.now()) => {
    const elapsed = getElapsedMinutes(order, now);
    const eta = getOrderEtaMinutes(order);

    if (order?.status === 'READY') return 'ready';
    if (isOrderDelayed(order, now)) return 'critical';
    if (!eta) return elapsed >= 20 ? 'high' : 'normal';

    const ratio = elapsed / Math.max(eta, 1);
    if (ratio >= 1) return 'critical';
    if (ratio >= 0.8) return 'high';
    if (ratio >= 0.5) return 'watch';
    return 'normal';
};

export const sortKitchenOrders = (orders, now = Date.now()) => (
    [...orders].sort((left, right) => {
        const urgencyWeight = {
            critical: 0,
            high: 1,
            watch: 2,
            normal: 3,
            ready: 4,
        };

        const urgencyDelta = urgencyWeight[getUrgencyLevel(left, now)] - urgencyWeight[getUrgencyLevel(right, now)];
        if (urgencyDelta !== 0) return urgencyDelta;

        return new Date(getOrderCreatedAt(left) || 0).getTime() - new Date(getOrderCreatedAt(right) || 0).getTime();
    })
);

export const filterKitchenOrders = (orders, filterKey, userId, now = Date.now()) => {
    switch (filterKey) {
        case 'NEW':
            return orders.filter((order) => order?.status === 'CREATED');
        case 'MINE':
            return orders.filter((order) => order?.cook === userId);
        case 'IN_PROGRESS':
            return orders.filter((order) => ['ACCEPTED', 'COOKING'].includes(order?.status));
        case 'READY':
            return orders.filter((order) => order?.status === 'READY');
        case 'DELAYED':
            return orders.filter((order) => isOrderDelayed(order, now));
        case 'AVAILABLE':
            return orders.filter((order) => order?.status === 'CREATED' && !order?.cook);
        default:
            return orders;
    }
};

export const buildKitchenCounts = (orders, userId, now = Date.now()) => (
    KITCHEN_HOME_FILTERS.reduce((accumulator, item) => {
        accumulator[item.key] = filterKitchenOrders(orders, item.key, userId, now).length;
        return accumulator;
    }, {})
);

export const extractKitchenMode = (user, menuSettings) => {
    const rawCandidates = [
        user?.kitchen_mode,
        user?.restaurant?.kitchen_mode,
        user?.restaurant?.queue_mode,
        user?.restaurant?.self_pick_enabled,
        user?.restaurant?.kitchen_self_pick,
        menuSettings?.kitchen_mode,
        menuSettings?.queue_mode,
        menuSettings?.self_pick_enabled,
        menuSettings?.kitchen_self_pick,
    ].filter((value) => value !== undefined && value !== null);

    for (const candidate of rawCandidates) {
        if (typeof candidate === 'boolean') {
            return candidate ? 'SELF_PICK' : 'CHEF_ASSIGN';
        }

        const normalized = String(candidate).toLowerCase();
        if (normalized.includes('self') || normalized.includes('pick')) {
            return 'SELF_PICK';
        }
        if (normalized.includes('chef') || normalized.includes('assign')) {
            return 'CHEF_ASSIGN';
        }
    }

    return user?.role === 'CHEF' ? 'CHEF_ASSIGN' : 'SELF_PICK';
};

export const getKitchenModeLabel = (mode) => (
    mode === 'CHEF_ASSIGN' ? 'Chef Assign Mode' : 'Self-Pick Mode'
);

export const toKitchenEvent = ({ type, order, title, message }) => ({
    id: [
        type,
        getOrderId(order) || 'system',
        order?.status || 'unknown',
        order?.updated_at || order?.created_at || 'no-timestamp',
    ].join('-'),
    type,
    title,
    message,
    createdAt: order?.updated_at || order?.created_at || null,
    orderId: getOrderId(order),
    status: order?.status,
});

export const mergeUniqueKitchenEvents = (...eventGroups) => {
    const seen = new Set();
    const merged = [];

    eventGroups.flat().forEach((event) => {
        if (!event?.id || seen.has(event.id)) {
            return;
        }

        seen.add(event.id);
        merged.push(event);
    });

    return merged;
};

export const buildKitchenEvents = (previousOrders, nextOrders) => {
    const previousMap = new Map(previousOrders.map((order) => [getOrderId(order), order]));
    const events = [];

    nextOrders.forEach((order) => {
        const previous = previousMap.get(getOrderId(order));

        if (!previous) {
            events.push(toKitchenEvent({
                type: KITCHEN_UPDATE_TYPES.CREATED,
                order,
                title: 'New order',
                message: `Table ${getOrderTableLabel(order)} entered the queue.`,
            }));
            return;
        }

        if (order?.status !== previous?.status) {
            const eventType = order?.status === 'READY'
                ? KITCHEN_UPDATE_TYPES.READY
                : ['CLOSED', 'CANCELLED'].includes(order?.status)
                    ? KITCHEN_UPDATE_TYPES.CLOSED
                    : KITCHEN_UPDATE_TYPES.UPDATED;

            const label = order?.status === 'READY'
                ? 'Order ready'
                : ['CLOSED', 'CANCELLED'].includes(order?.status)
                    ? 'Order closed'
                    : 'Order updated';

            events.push(toKitchenEvent({
                type: eventType,
                order,
                title: label,
                message: `Order ${getOrderShortCode(order)} is now ${String(order?.status || 'updated').toLowerCase()}.`,
            }));
        }

        if (Number(order?.extra_time || 0) > Number(previous?.extra_time || 0)) {
            events.push(toKitchenEvent({
                type: KITCHEN_UPDATE_TYPES.DELAY,
                order,
                title: 'Delay added',
                message: `ETA extended for table ${getOrderTableLabel(order)}.`,
            }));
        }
    });

    return events;
};

export const getKitchenRealtimeUrl = (user) => (
    user?.kitchen_websocket_url ||
    user?.websocket_url ||
    user?.restaurant?.kitchen_websocket_url ||
    user?.restaurant?.websocket_url ||
    null
);

export const getApiErrorMessage = (error, fallback = 'Something went wrong.') => (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.non_field_errors?.[0] ||
    fallback
);

const BAR_KEYWORDS = [
    'bar', 'drink', 'beverage', 'cocktail', 'mocktail',
    'beer', 'wine', 'whiskey', 'whisky', 'vodka', 'rum',
    'gin', 'tequila', 'liquor', 'liqueur', 'spirit',
    'juice', 'soda', 'cola', 'lemonade', 'smoothie',
    'coffee', 'tea', 'espresso', 'cappuccino', 'latte',
    'water', 'mineral', 'sparkling', 'tonic', 'syrup',
];

export const isBarItem = (item, dishes = []) => {
    const categoryName = item?.category_name || item?.category?.name || item?.category || '';
    const catLower = String(categoryName).toLowerCase();
    if (BAR_KEYWORDS.some((kw) => catLower.includes(kw))) {
        return true;
    }

    const dishName = item?.dish_name || item?.name || '';
    const nameLower = dishName.toLowerCase();
    if (BAR_KEYWORDS.some((kw) => nameLower.includes(kw))) {
        return true;
    }

    if (item?.dish && dishes.length > 0) {
        const dishId = item.dish;
        const dish = dishes.find((d) => String(d.id) === String(dishId) || String(d.uuid) === String(dishId));
        if (dish) {
            const dishCat = dish?.category_name || dish?.category?.name || dish?.category || '';
            const dishCatLower = String(dishCat).toLowerCase();
            return BAR_KEYWORDS.some((kw) => dishCatLower.includes(kw));
        }
    }

    return false;
};

export const filterBarOrders = (orders, dishes = []) => (
    orders.filter((order) => (order?.items || []).some((item) => isBarItem(item, dishes)))
);
