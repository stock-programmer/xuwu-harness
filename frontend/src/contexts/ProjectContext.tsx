import React, { createContext, useContext, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/services/api/project.api';
import type { Project } from '@/types/project.types';

interface ProjectContextValue {
  project: Project | undefined;
  projectId: string | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { projectId } = useParams<{ projectId: string }>();

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getProject(projectId!),
    enabled: !!projectId,
    refetchInterval: 5000, // Refetch every 5 seconds for status updates
    refetchOnWindowFocus: true,
  });

  return (
    <ProjectContext.Provider
      value={{
        project,
        projectId,
        isLoading,
        error: error as Error | null,
        refetch,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
