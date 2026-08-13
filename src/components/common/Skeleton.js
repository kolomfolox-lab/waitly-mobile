import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const COLORS = {
  light: '#e2e8f0',
  dark: '#f1f5f9',
};

export function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: COLORS.light, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCircle({ size, style }) {
  return <SkeletonBox width={size} height={size} borderRadius={size / 2} style={style} />;
}

export function SkeletonText({ lines = 1, width = '100%', lineHeight = 14, lastLineWidth = '60%', style }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : width}
          height={lineHeight}
          borderRadius={4}
        />
      ))}
    </View>
  );
}

export function SkeletonCard({ height = 120, style }) {
  return (
    <View style={[{ padding: 16, backgroundColor: '#fff', borderRadius: 16 }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <SkeletonBox width="60%" height={20} borderRadius={4} />
        <SkeletonBox width={50} height={16} borderRadius={4} />
      </View>
      <SkeletonText lines={2} lineHeight={12} width="90%" lastLineWidth="40%" />
    </View>
  );
}

export function SkeletonAvatarRow({ style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      <SkeletonCircle size={44} />
      <View style={{ flex: 1, gap: 4 }}>
        <SkeletonBox width="40%" height={16} borderRadius={4} />
        <SkeletonBox width="25%" height={12} borderRadius={4} />
      </View>
    </View>
  );
}

export function SkeletonStatsRow({ style }) {
  return (
    <View style={[{ flexDirection: 'row', gap: 8 }, style]}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4, padding: 12 }}>
          <SkeletonBox width={32} height={24} borderRadius={4} />
          <SkeletonBox width="70%" height={10} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonOrderCard({ style }) {
  return (
    <View style={[{ padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 12 }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SkeletonCircle size={8} />
          <SkeletonBox width={120} height={18} borderRadius={4} />
          <SkeletonBox width={24} height={18} borderRadius={8} />
        </View>
        <SkeletonBox width={50} height={12} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
        <SkeletonBox width={60} height={22} borderRadius={10} />
        <SkeletonBox width={80} height={22} borderRadius={10} />
        <SkeletonBox width={50} height={22} borderRadius={10} />
      </View>
      <SkeletonBox width={80} height={44} borderRadius={12} />
    </View>
  );
}

export function SkeletonDashboard({ style }) {
  return (
    <View style={[{ padding: 16, gap: 16 }, style]}>
      <SkeletonAvatarRow />
      <SkeletonStatsRow />
      <SkeletonBox width="100%" height={120} borderRadius={16} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}
