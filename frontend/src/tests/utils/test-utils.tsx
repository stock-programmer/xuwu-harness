import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the default render with our custom one
export { customRender as render };

// Helper function to create mock file nodes
export const createMockFileNode = (overrides?: Partial<any>): any => ({
  id: 'file-1',
  name: 'test.ts',
  path: '/project/test.ts',
  type: 'file',
  size: 1024,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Helper function to create mock projects
export const createMockProject = (overrides?: Partial<any>): any => ({
  id: 'project-1',
  name: 'Test Project',
  type: 'fullstack',
  status: 'ready',
  rootPath: '/path/to/project',
  outputPath: '/path/to/project/output',
  claudeModel: 'claude-sonnet-4',
  maxRetries: 3,
  totalTasks: 10,
  completedTasks: 5,
  failedTasks: 0,
  currentLayer: 1,
  totalLayers: 3,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});
