import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { SkeletonBox } from './Skeleton';

const DEFAULT_BLURHASH = 'L6PZ0Si=ayfQ~qfQayfQ~qfQayfQ';
const BLURHASH_SIZE = { width: 32, height: 32 };

export default function BlurhashImage({
  uri,
  blurhash,
  style,
  contentFit = 'cover',
  transition = 300,
  skeleton = true,
}) {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!uri || error) {
    if (skeleton) {
      return <SkeletonBox width={style?.width || '100%'} height={style?.height || 200} borderRadius={style?.borderRadius || 0} style={style} />;
    }
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri }}
        style={[styles.image, style]}
        onError={() => setError(true)}
        onLoad={() => setIsLoaded(true)}
      />
      {!isLoaded && skeleton && (
        <View style={[StyleSheet.absoluteFill, { borderRadius: style?.borderRadius || 0 }]}>
          <SkeletonBox width="100%" height="100%" borderRadius={style?.borderRadius || 0} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
