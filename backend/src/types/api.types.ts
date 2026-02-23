// 项目类型
export type ProjectType = 'fullstack' | 'frontend' | 'backend';

// API 响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 创建项目请求
export interface CreateProjectRequest {
  name: string;
  type: ProjectType;
  root_path: string;
}

// 执行模式请求
export interface ExecuteModeRequest {
  mode: string;
  input: string;
}
