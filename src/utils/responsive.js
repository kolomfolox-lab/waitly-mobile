export const getDeviceLayout = (width) => {
    if (width >= 1180) {
        return { isTablet: true, columns: 3, gutter: 18, cardMinHeight: 260 };
    }
    if (width >= 760) {
        return { isTablet: true, columns: 2, gutter: 16, cardMinHeight: 250 };
    }
    return { isTablet: false, columns: 1, gutter: 12, cardMinHeight: 220 };
};

export const getGridItemWidth = (width, columns, gutter, horizontalPadding = 32) => {
    const available = width - horizontalPadding - gutter * (columns - 1);
    return Math.floor(available / columns);
};
