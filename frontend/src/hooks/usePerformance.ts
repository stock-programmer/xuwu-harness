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
        console.warn(`${componentName} 渲染耗时: ${measure.duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};
