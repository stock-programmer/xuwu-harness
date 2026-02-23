import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tailwind.css';
import './styles/mermaid.css';
import App from './App.tsx';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

// 监控 Web Vitals
const reportWebVitals = (metric: any) => {
  console.log(metric);
  // 可以发送到分析服务
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  // });
};

onCLS(reportWebVitals);
onINP(reportWebVitals); // Replaced FID with INP (Interaction to Next Paint)
onFCP(reportWebVitals);
onLCP(reportWebVitals);
onTTFB(reportWebVitals);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
