import { httpClient } from './http-client';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStats,
} from '@/types/project.types';
import type { PaginatedResponse } from '@/types/api.types';

/**
 * Transform backend response (snake_case) to frontend format (camelCase)
 */
const transformProject = (backendProject: any): Project => {
  return {
    id: backendProject.id,
    name: backendProject.name,
    type: backendProject.type,
    status: backendProject.status,
    rootPath: backendProject.root_path,
    createdAt: backendProject.created_at,
    updatedAt: backendProject.updated_at,
    currentLayer: backendProject.current_mode ? parseInt(backendProject.current_mode) : undefined,
    // Add other fields as needed
  };
};

/**
 * Project API Service
 */
export const projectApi = {
  /**
   * Get all projects
   */
  getProjects: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<PaginatedResponse<Project>> => {
    const response: any = await httpClient.get('/api/projects', { params });
    // Backend returns: { success: true, data: { projects: [...], pagination: {...} } }
    // Transform to frontend format: { items: [...], total: number, ... }
    return {
      items: (response.data?.projects || []).map(transformProject),
      total: response.data?.pagination?.total || 0,
      page: response.data?.pagination?.offset
        ? Math.floor(response.data.pagination.offset / (response.data.pagination.limit || 1))
        : 0,
      pageSize: response.data?.pagination?.limit || 10,
    };
  },

  /**
   * Get project by ID
   */
  getProject: async (projectId: string): Promise<Project> => {
    const response: any = await httpClient.get(`/api/projects/${projectId}`);
    // Backend returns: { success: true, data: { project, stats } }
    return transformProject(response.data?.project || response.data);
  },

  /**
   * Create new project
   */
  createProject: async (data: CreateProjectInput): Promise<Project> => {
    // Transform camelCase to snake_case for backend compatibility
    const backendData = {
      name: data.name,
      type: data.type,
      root_path: data.rootPath,
      status: 'active',
    };
    const response: any = await httpClient.post('/api/projects', backendData);
    // Response format: { success: true, data: { project } }
    return transformProject(response.data);
  },

  /**
   * Update project
   */
  updateProject: async (projectId: string, data: UpdateProjectInput): Promise<Project> => {
    const response: any = await httpClient.put(`/api/projects/${projectId}`, data);
    // Backend returns: { success: true, data: project }
    return transformProject(response.data);
  },

  /**
   * Delete project
   */
  deleteProject: async (projectId: string): Promise<void> => {
    return httpClient.delete(`/api/projects/${projectId}`);
  },

  /**
   * Get project statistics
   */
  getProjectStats: async (): Promise<ProjectStats> => {
    const response: any = await httpClient.get('/api/projects/stats');
    // Backend returns: { success: true, data: { totalProjects: ..., ... } }
    // Extract the data object
    return response.data || {
      totalProjects: 0,
      runningProjects: 0,
      completedProjects: 0,
      failedProjects: 0,
      pausedProjects: 0,
    };
  },

  /**
   * Start project execution
   */
  startProject: async (projectId: string): Promise<void> => {
    return httpClient.post(`/api/projects/${projectId}/start`);
  },

  /**
   * Pause project execution
   */
  pauseProject: async (projectId: string): Promise<void> => {
    return httpClient.post(`/api/projects/${projectId}/pause`);
  },

  /**
   * Resume project execution
   */
  resumeProject: async (projectId: string): Promise<void> => {
    return httpClient.post(`/api/projects/${projectId}/resume`);
  },

  /**
   * Reset project
   */
  resetProject: async (projectId: string): Promise<void> => {
    return httpClient.post(`/api/projects/${projectId}/reset`);
  },

  /**
   * Get project status
   */
  getProjectStatus: async (
    projectId: string
  ): Promise<{
    status: string;
    currentLayer: number;
    completedTasks: number;
    totalTasks: number;
  }> => {
    const response: any = await httpClient.get(`/api/projects/${projectId}/status`);
    // Backend returns: { success: true, data: { status, currentLayer, ... } }
    return response.data;
  },
};
