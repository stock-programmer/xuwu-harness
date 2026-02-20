# Task: 性能优化

## 元数据
- **Task ID**: frontend-dev-plan-8.1
- **Layer**: 8
- **Dependencies**: [7.1, 7.2]
- **Parallel Group**: []
- **Estimated Complexity**: Medium

## 目标
对前端应用进行性能优化，包括代码分割、懒加载、Bundle 优化、缓存策略、性能监控等。

## 前置条件
- 所有测试已完成（Layer 7 完成）

## 实现步骤

### 1. 代码分割和懒加载优化

#### 路由级别代码分割
已在 `src/routes/index.tsx` 中实现，确保所有页面组件都使用 lazy 加载：

```typescript
import { lazy } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProjectView = lazy(() => import('@/pages/ProjectView'));
const Settings = lazy(() => import('@/pages/Settings'));
```

#### 组件级别代码分割
创建 `src/components/common/LazyComponent/LazyComponent.tsx`：
```typescript
import React, { Suspense, lazy, ComponentType } from 'react';
import { Spin } from 'antd';

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = <Spin size="large" />,
}) => {
  const Component = lazy(loader);

  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
};
```

### 2. Vite 构建优化
更新 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // Gzip 压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 10KB 以上才压缩
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli 压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle 分析
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // 目标浏览器
    target: 'es2015',

    // 启用 CSS 代码分割
    cssCodeSplit: true,

    // Chunk 大小警告限制
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // 手动分割代码
        manualChunks: {
          // React 核心
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // Ant Design
          'antd-vendor': ['antd', '@ant-design/icons'],

          // 状态管理和数据获取
          'state-vendor': ['zustand', '@tanstack/react-query'],

          // Monaco Editor
          'monaco-editor': ['monaco-editor', '@monaco-editor/react'],

          // 图表和可视化
          'viz-vendor': ['mermaid'],

          // 工具库
          'utils-vendor': ['axios', 'socket.io-client'],
        },

        // 输出文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true,
      },
    },
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      'zustand',
      '@tanstack/react-query',
    ],
  },
});
```

安装优化插件：
```bash
npm install --save-dev rollup-plugin-visualizer vite-plugin-compression
```

### 3. 图片和资源优化

#### 图片懒加载组件
创建 `src/components/common/LazyImage/LazyImage.tsx`：
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Spin } from 'antd';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  threshold?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  placeholder = '',
  threshold = 0.1,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            setLoading(false);
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, threshold]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spin />
        </div>
      )}
      <img ref={imgRef} src={imageSrc} {...props} />
    </div>
  );
};
```

### 4. 虚拟滚动优化
对于大列表（如文件树、任务列表），使用虚拟滚动：

```bash
npm install react-window
npm install --save-dev @types/react-window
```

创建 `src/components/common/VirtualList/VirtualList.tsx`：
```typescript
import React from 'react';
import { FixedSizeList } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width: string | number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  width,
  renderItem,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{renderItem(items[index], index)}</div>
  );

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 5. React 性能优化

#### 创建性能监控 Hook
创建 `src/hooks/usePerformance.ts`：
```typescript
import { useEffect } from 'react';

export const usePerformance = (componentName: string) => {
  useEffect(() => {
    // 首次渲染性能标记
    performance.mark(`${componentName}-mount-start`);

    return () => {
      performance.mark(`${componentName}-mount-end`);
      performance.measure(
        `${componentName}-mount`,
        `${componentName}-mount-start`,
        `${componentName}-mount-end`
      );

      const measure = performance.getEntriesByName(`${componentName}-mount`)[0];
      if (measure && measure.duration > 100) {
        console.warn(
          `${componentName} 渲染耗时: ${measure.duration.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);
};
```

#### 创建 memo 化的组件
创建 `src/utils/react.ts`：
```typescript
import { memo } from 'react';

// 深度比较的 memo
export function deepMemo<T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (
    prevProps: React.ComponentProps<T>,
    nextProps: React.ComponentProps<T>
  ) => boolean
): T {
  return memo(Component, propsAreEqual) as T;
}

// 仅比较指定字段的 memo
export function shallowMemo<T extends React.ComponentType<any>>(
  Component: T,
  keys: string[]
): T {
  return memo(Component, (prevProps, nextProps) => {
    return keys.every((key) => prevProps[key] === nextProps[key]);
  }) as T;
}
```

### 6. 缓存策略优化

#### 更新 React Query 配置
更新 `src/services/api/query-client.ts`：
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据保持新鲜时间
      staleTime: 5 * 60 * 1000, // 5 分钟

      // 缓存时间
      cacheTime: 10 * 60 * 1000, // 10 分钟

      // 重试策略
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // 窗口聚焦时重新获取
      refetchOnWindowFocus: false,

      // 重连时重新获取
      refetchOnReconnect: true,
    },
  },
});
```

#### Service Worker 缓存（可选）
创建 `public/sw.js`：
```javascript
const CACHE_NAME = 'claude-harness-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 7. 性能监控和分析

#### 创建性能监控工具
创建 `src/utils/performance.ts`：
```typescript
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  // 记录性能指标
  record(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  // 获取平均值
  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // 获取所有指标
  getAllMetrics() {
    const result: Record<string, { avg: number; count: number }> = {};
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: this.getAverage(name),
        count: values.length,
      };
    });
    return result;
  }

  // 清除指标
  clear() {
    this.metrics.clear();
  }

  // 上报性能数据（可选）
  report() {
    const metrics = this.getAllMetrics();
    console.table(metrics);

    // 这里可以发送到监控服务
    // fetch('/api/metrics', {
    //   method: 'POST',
    //   body: JSON.stringify(metrics),
    // });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
```

#### Web Vitals 监控
```bash
npm install web-vitals
```

更新 `src/main.tsx`：
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// 监控 Web Vitals
getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 8. 创建性能优化检查清单
创建 `docs/performance-checklist.md`：
```markdown
# 性能优化检查清单

## 代码分割
- [x] 路由级别代码分割
- [x] 组件级别懒加载
- [x] 第三方库分包

## 资源优化
- [x] 图片懒加载
- [x] 图片压缩
- [x] Gzip/Brotli 压缩
- [ ] CDN 加速

## 渲染优化
- [x] React.memo 优化
- [x] 虚拟滚动（大列表）
- [x] 防抖节流
- [ ] Web Workers（耗时计算）

## 缓存策略
- [x] React Query 缓存
- [x] LocalStorage 缓存
- [ ] Service Worker 缓存

## 性能监控
- [x] Web Vitals
- [x] 性能监控工具
- [ ] 错误监控（Sentry）

## Bundle 优化
- [x] Tree Shaking
- [x] 代码压缩
- [x] 移除 console
- [x] Bundle 分析

## 目标指标
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle Size < 500KB (gzipped)
```

## 期望输出
- ✅ 代码分割和懒加载优化
- ✅ Vite 构建优化配置
- ✅ 图片和资源优化
- ✅ 虚拟滚动实现
- ✅ React 性能优化（memo, hooks）
- ✅ 缓存策略优化
- ✅ 性能监控工具
- ✅ Web Vitals 集成
- ✅ Bundle 分析和优化
- ✅ 性能优化文档

## 验证标准
```bash
# 构建生产版本
npm run build

# 分析 Bundle
npm run build -- --mode analyze

# 检查性能指标
# - LCP < 2.5s
# - FID < 100ms
# - CLS < 0.1
# - Bundle Size < 500KB (gzipped)

# 运行 Lighthouse
npx lighthouse http://localhost:5173 --view

# Performance Score > 90
```

## Claude 执行 Prompt

请对前端应用进行性能优化，具体要求如下：

1. **代码分割和懒加载**：
   - 确保所有路由组件使用 lazy 加载
   - 创建 LazyComponent 通用组件
   - 大型第三方库单独分包

2. **Vite 构建优化**（vite.config.ts）：
   - 安装优化插件（visualizer, compression）
   - 配置 manualChunks 手动分包
   - 配置 Gzip 和 Brotli 压缩
   - 配置 Terser 压缩选项
   - 生产环境移除 console

3. **资源优化**：
   - 创建 LazyImage 图片懒加载组件
   - 使用 IntersectionObserver

4. **虚拟滚动**：
   - 安装 react-window
   - 创建 VirtualList 组件
   - 应用到大列表

5. **React 性能优化**：
   - 创建 usePerformance Hook
   - 创建 memo 工具函数
   - 优化组件渲染

6. **缓存策略**：
   - 优化 React Query 配置
   - 配置 staleTime 和 cacheTime
   - 可选：Service Worker

7. **性能监控**：
   - 创建 PerformanceMonitor 工具
   - 集成 Web Vitals
   - 记录关键性能指标

8. **文档和检查清单**：
   - 创建性能优化检查清单
   - 记录优化措施和目标指标

9. **验证**：
   - Bundle 大小 < 500KB (gzipped)
   - Lighthouse Score > 90
   - Web Vitals 达标

确保应用性能优秀、加载快速、运行流畅。
