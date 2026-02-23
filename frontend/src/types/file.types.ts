// 文件节点类型
export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
  createdAt?: string;
  updatedAt?: string;
  lastModified?: string;
}

// 文件内容类型
export interface FileContent {
  path: string;
  content: string;
  encoding?: string;
  size?: number;
}

// 文件创建请求
export interface CreateFileRequest {
  path: string;
  content?: string;
  type: 'file' | 'directory';
}

// 文件重命名请求
export interface RenameFileRequest {
  oldPath: string;
  newPath: string;
}

// 文件删除请求
export interface DeleteFileRequest {
  path: string;
}

// 文件树查询参数
export interface FileTreeQuery {
  path?: string;
  depth?: number;
}
