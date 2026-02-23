import React, { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';
import { Spin } from 'antd';

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = (
    <div className="flex items-center justify-center h-full">
      <Spin size="large" />
    </div>
  ),
}) => {
  const Component = lazy(loader);

  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
};
