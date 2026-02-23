import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './routes';
import { theme } from './config/theme';
import { queryClient } from './services/query-client';
import { KeyboardShortcuts, useGlobalShortcuts } from '@/components/common';

function App() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useGlobalShortcuts(() => setShortcutsOpen(true));

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <RouterProvider router={router} />
        {/* React Query DevTools - 仅开发环境 */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        {/* 全局快捷键帮助 */}
        <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
