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

  // 上报性能数据
  report() {
    const metrics = this.getAllMetrics();
    console.table(metrics);

    // 这里可以发送到监控服务
    // fetch('/api/metrics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metrics),
    // });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
