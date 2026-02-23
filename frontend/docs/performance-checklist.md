# 性能优化检查清单

## 代码分割
- [x] 路由级别代码分割
- [x] 组件级别懒加载 (LazyComponent)
- [x] 第三方库分包
  - [x] React 核心 (react-vendor)
  - [x] Ant Design (antd-vendor)
  - [x] 状态管理 (state-vendor)
  - [x] Monaco Editor
  - [x] 可视化库 (viz-vendor)
  - [x] 工具库 (utils-vendor)

## 资源优化
- [x] 图片懒加载 (LazyImage)
- [x] Gzip 压缩
- [x] Brotli 压缩
- [ ] 图片压缩优化
- [ ] CDN 加速

## 渲染优化
- [x] React.memo 工具 (deepMemo, shallowMemo)
- [x] 虚拟滚动 (VirtualList for large lists)
- [x] 性能监控 Hook (usePerformance)
- [ ] 防抖节流优化
- [ ] Web Workers (耗时计算)

## 缓存策略
- [x] React Query 缓存配置
- [ ] LocalStorage 缓存策略
- [ ] Service Worker 缓存
- [ ] HTTP 缓存头优化

## 性能监控
- [x] Web Vitals 集成
  - [x] CLS (Cumulative Layout Shift)
  - [x] FID (First Input Delay)
  - [x] FCP (First Contentful Paint)
  - [x] LCP (Largest Contentful Paint)
  - [x] TTFB (Time to First Byte)
- [x] PerformanceMonitor 工具类
- [ ] 错误监控 (Sentry/类似工具)
- [ ] 自定义性能指标上报

## Bundle 优化
- [x] Tree Shaking (Vite 默认)
- [x] 代码压缩 (Terser)
- [x] 移除 console (生产环境)
- [x] Bundle 分析 (rollup-plugin-visualizer)
- [x] CSS 代码分割
- [x] 手动 Chunk 分割
- [x] 优化文件命名

## 构建配置
- [x] 目标浏览器: ES2015
- [x] 压缩算法: Terser
- [x] 压缩阈值: 10KB
- [x] Chunk 大小警告: 1000KB
- [x] 依赖预构建优化

## 性能目标
| 指标 | 目标值 | 状态 |
|------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 🔄 待测试 |
| FID (First Input Delay) | < 100ms | 🔄 待测试 |
| CLS (Cumulative Layout Shift) | < 0.1 | 🔄 待测试 |
| Bundle Size (gzipped) | < 500KB | 🔄 待测试 |
| Lighthouse Performance Score | > 90 | 🔄 待测试 |

## 可用的性能工具

### 组件
- `LazyComponent` - 组件级别懒加载
- `LazyImage` - 图片懒加载
- `VirtualList` - 虚拟滚动列表

### Hooks
- `usePerformance(componentName)` - 组件性能监控

### 工具函数
- `deepMemo(Component)` - 深度比较的 memo
- `shallowMemo(Component, keys)` - 浅比较指定字段的 memo
- `performanceMonitor.record(name, value)` - 记录性能指标
- `performanceMonitor.getAllMetrics()` - 获取所有指标
- `performanceMonitor.report()` - 上报性能数据

## 验证方法

### 1. 构建分析
```bash
# 构建生产版本
npm run build

# 查看 Bundle 分析报告
open dist/stats.html
```

### 2. 性能测试
```bash
# 运行 Lighthouse
npx lighthouse http://localhost:5173 --view

# 或使用 Chrome DevTools
# 1. 打开开发者工具
# 2. Lighthouse 标签
# 3. 生成报告
```

### 3. Web Vitals 监控
```bash
# 启动开发服务器
npm run dev

# 打开浏览器控制台，查看 Web Vitals 指标
```

## 后续优化建议
- [ ] 实现 Service Worker 离线缓存
- [ ] 配置 CDN 加速静态资源
- [ ] 添加图片自动压缩工具
- [ ] 集成错误监控服务 (Sentry)
- [ ] 实现自定义性能指标上报
- [ ] 使用 Web Workers 处理耗时计算
- [ ] 优化字体加载策略
- [ ] 实现资源预加载 (preload/prefetch)
- [ ] 添加性能预算(Performance Budget)

## 最佳实践
1. **代码分割**: 按路由和功能模块拆分代码
2. **懒加载**: 非关键资源延迟加载
3. **Tree Shaking**: 移除未使用的代码
4. **压缩**: 启用 Gzip/Brotli 压缩
5. **缓存**: 合理配置浏览器和 CDN 缓存
6. **监控**: 持续监控性能指标，及时发现问题
7. **测试**: 定期进行性能测试，确保优化效果
