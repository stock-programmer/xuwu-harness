import React from 'react';

// 深度比较的 memo
export function deepMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) {
  return React.memo(Component, propsAreEqual);
}

// 仅比较指定字段的 memo
export function shallowMemo<P extends object>(
  Component: React.ComponentType<P>,
  keys: (keyof P)[]
) {
  return React.memo(Component, (prevProps, nextProps) => {
    return keys.every((key) => prevProps[key] === nextProps[key]);
  });
}
