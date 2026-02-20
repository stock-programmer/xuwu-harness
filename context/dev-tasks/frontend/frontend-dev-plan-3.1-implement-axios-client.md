# Task: 实现 Axios HTTP 客户端封装

## 元数据
- **Task ID**: frontend-dev-plan-3.1
- **Layer**: 3
- **Dependencies**: [2.6]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6]
- **Estimated Complexity**: Medium

## 目标
安装 Axios，封装 HTTP 客户端，配置请求/响应拦截器，实现错误处理。

## 前置条件
- 目录结构已创建（Task 2.6 完成）

## 实现步骤

### 1. 安装 Axios
```bash
cd frontend
npm install axios
```

### 2. 创建 HTTP 客户端封装
创建 `src/services/api/http-client.ts`：
```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 添加认证 token
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求时间戳
        config.headers['X-Request-Time'] = Date.now().toString();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 未授权，清除 token 并跳转登录
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('无权限访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error(`请求失败: ${status}`);
      }

      return Promise.reject(data || error.message);
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误，请检查您的网络连接');
      return Promise.reject('网络错误');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      return Promise.reject(error.message);
    }
  }

  // GET 请求
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  // POST 请求
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  // PUT 请求
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  // DELETE 请求
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  // PATCH 请求
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }
}

export const httpClient = new HttpClient();
```

### 3. 创建 API 类型定义
创建 `src/types/api.types.ts`：
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 4. 创建示例 API 服务
创建 `src/services/api/project.api.ts`：
```typescript
import { httpClient } from './http-client';

export interface Project {
  id: string;
  name: string;
  type: 'fullstack' | 'frontend' | 'backend';
  status: string;
  created_at: string;
}

export const projectApi = {
  // 获取项目列表
  getProjects: () => httpClient.get<Project[]>('/api/projects'),

  // 获取单个项目
  getProject: (id: string) => httpClient.get<Project>(`/api/projects/${id}`),

  // 创建项目
  createProject: (data: Partial<Project>) => httpClient.post<Project>('/api/projects', data),

  // 更新项目
  updateProject: (id: string, data: Partial<Project>) =>
    httpClient.put<Project>(`/api/projects/${id}`, data),

  // 删除项目
  deleteProject: (id: string) => httpClient.delete(`/api/projects/${id}`),
};
```

### 5. 配置环境变量
创建 `.env.development`：
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_APP_VERSION=1.0.0
```

创建 `.env.production`：
```env
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
VITE_APP_VERSION=1.0.0
```

## 期望输出
- ✅ Axios 安装成功
- ✅ `src/services/api/http-client.ts` 创建
- ✅ 请求/响应拦截器配置完成
- ✅ 错误处理实现
- ✅ `src/services/api/project.api.ts` 示例 API 创建
- ✅ 环境变量配置完成

## 验证标准
```typescript
import { httpClient } from '@/services/api/http-client';
import { projectApi } from '@/services/api/project.api';

// 测试 HTTP 客户端
const data = await httpClient.get('/api/test');

// 测试项目 API
const projects = await projectApi.getProjects();
```

## Claude 执行 Prompt

请为前端项目实现 Axios HTTP 客户端封装，具体要求如下：

1. **安装 Axios**：
   - 安装 axios 包

2. **创建 HTTP 客户端**（src/services/api/http-client.ts）：
   - 创建 HttpClient 类封装 axios 实例
   - 配置 baseURL（从环境变量读取）
   - 配置超时时间：30秒
   - 实现请求拦截器：
     - 自动添加 Authorization header（从 localStorage 读取 token）
     - 添加请求时间戳 header
   - 实现响应拦截器：
     - 错误处理（401/403/404/500）
     - 401 时清除 token 并跳转登录
   - 封装常用方法：get/post/put/delete/patch

3. **创建 API 类型**（src/types/api.types.ts）：
   - ApiResponse<T> 通用响应类型
   - PaginatedResponse<T> 分页响应类型

4. **创建示例 API**（src/services/api/project.api.ts）：
   - 定义 Project 接口
   - 实现 projectApi 对象：
     - getProjects()
     - getProject(id)
     - createProject(data)
     - updateProject(id, data)
     - deleteProject(id)

5. **配置环境变量**：
   - .env.development: VITE_API_URL=http://localhost:3000
   - .env.production: VITE_API_URL=https://api.example.com

6. **验证**：
   - 确保可以导入和使用 httpClient
   - 确保 TypeScript 类型正确

确保 HTTP 客户端可以正常工作，拦截器生效，错误处理完善。
