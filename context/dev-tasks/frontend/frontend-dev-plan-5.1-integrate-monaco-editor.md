# Task: 集成 Monaco Editor

## 元数据
- **Task ID**: frontend-dev-plan-5.1
- **Layer**: 5
- **Dependencies**: [4.1]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4, 5.5]
- **Estimated Complexity**: High

## 目标
集成 Monaco Editor（VS Code 的编辑器核心），实现代码编辑、语法高亮、智能提示等功能。

## 前置条件
- 文件浏览器已实现（Task 4.1 完成）

## 实现步骤

### 1. 安装 Monaco Editor
```bash
cd frontend
npm install @monaco-editor/react monaco-editor
```

### 2. 创建 Monaco Editor 组件
创建 `src/components/business/CodeEditor/CodeEditor.tsx`：
```typescript
import React, { useRef, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { Spin, message } from 'antd';
import { getLanguageFromExtension } from '@/utils/file';

interface CodeEditorProps {
  value: string;
  language?: string;
  path?: string;
  onChange?: (value: string | undefined) => void;
  onSave?: (value: string) => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'light';
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  path,
  onChange,
  onSave,
  readOnly = false,
  theme = 'vs-dark',
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // 从文件路径自动检测语言
  const detectedLanguage = path
    ? getLanguageFromExtension(path.split('.').pop() || '')
    : language || 'plaintext';

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // 注册保存快捷键 (Ctrl/Cmd + S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave && editor.getValue()) {
        onSave(editor.getValue());
        message.success('文件已保存');
      }
    });

    // 配置编辑器选项
    editor.updateOptions({
      minimap: {
        enabled: true,
      },
      fontSize: 14,
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      readOnly,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange?.(value);
  };

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language={detectedLanguage}
        value={value}
        theme={theme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={<Spin size="large" tip="加载编辑器..." />}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          cursorStyle: 'line',
          automaticLayout: true,
          glyphMargin: true,
          readOnly,
        }}
      />
    </div>
  );
};
```

### 3. 创建文件编辑器容器组件
创建 `src/features/file-explorer/components/FileEditor.tsx`：
```typescript
import React, { useEffect, useState } from 'react';
import { Card, Typography, Space, Button, message, Spin, Tag } from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { CodeEditor } from '@/components/business/CodeEditor/CodeEditor';
import { useFileExplorerStore } from '../store/file-explorer.store';
import { fileApi } from '@/services/api/file.api';
import { formatFileSize, formatDateTime } from '@/utils/format';

const { Title, Text } = Typography;

interface FileEditorProps {
  projectId: string;
}

export const FileEditor: React.FC<FileEditorProps> = ({ projectId }) => {
  const { selectedFile } = useFileExplorerStore();
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // 加载文件内容
  useEffect(() => {
    if (!selectedFile || selectedFile.type !== 'file') {
      setContent('');
      setOriginalContent('');
      setIsDirty(false);
      return;
    }

    const loadContent = async () => {
      setLoading(true);
      try {
        const fileContent = await fileApi.getFileContent(
          projectId,
          selectedFile.path
        );
        setContent(fileContent.content);
        setOriginalContent(fileContent.content);
        setIsDirty(false);
      } catch (error: any) {
        message.error(error.message || '加载文件失败');
        setContent('');
        setOriginalContent('');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [selectedFile, projectId]);

  // 监听内容变化
  const handleContentChange = (value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    setIsDirty(newContent !== originalContent);
  };

  // 保存文件
  const handleSave = async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      // 这里应该调用保存 API
      // await fileApi.updateFileContent(projectId, selectedFile.path, content);

      // 临时模拟保存
      await new Promise((resolve) => setTimeout(resolve, 500));

      setOriginalContent(content);
      setIsDirty(false);
      message.success('保存成功');
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 重新加载
  const handleReload = () => {
    setContent(originalContent);
    setIsDirty(false);
  };

  // 关闭文件
  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm('文件有未保存的更改，确定要关闭吗？');
      if (!confirmed) return;
    }
    useFileExplorerStore.getState().selectFile(null);
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">请从左侧选择一个文件</p>
        </div>
      </div>
    );
  }

  if (selectedFile.type !== 'file') {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">无法编辑目录</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="加载文件中..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card size="small" className="mb-2">
        <div className="flex items-center justify-between">
          <Space direction="vertical" size={0}>
            <div className="flex items-center gap-2">
              <Title level={5} className="m-0">
                {selectedFile.name}
              </Title>
              {isDirty && (
                <Tag color="orange" className="m-0">
                  未保存
                </Tag>
              )}
            </div>
            <Space size="small" className="text-xs text-gray-500">
              <Text type="secondary">{selectedFile.path}</Text>
              {selectedFile.size !== undefined && (
                <Text type="secondary">
                  {formatFileSize(selectedFile.size)}
                </Text>
              )}
              {selectedFile.lastModified && (
                <Text type="secondary">
                  {formatDateTime(selectedFile.lastModified)}
                </Text>
              )}
            </Space>
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReload}
              disabled={!isDirty || saving}
              size="small"
            >
              撤销更改
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              disabled={!isDirty}
              size="small"
            >
              保存
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleClose}
              size="small"
            >
              关闭
            </Button>
          </Space>
        </div>
      </Card>

      {/* Editor */}
      <div className="flex-1 border border-gray-200 rounded overflow-hidden">
        <CodeEditor
          value={content}
          path={selectedFile.path}
          onChange={handleContentChange}
          onSave={handleSave}
          theme="vs-dark"
        />
      </div>
    </div>
  );
};
```

### 4. 更新 ProjectView 集成文件编辑器
更新 `src/pages/ProjectView/index.tsx`：
```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { FileEditor } from '@/features/file-explorer/components/FileEditor';
import { useOutputWebSocket } from '@/features/output-console/hooks/useOutputWebSocket';

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { connected } = useOutputWebSocket(projectId);

  if (!projectId) {
    return <div>项目不存在</div>;
  }

  return (
    <div className="h-full">
      <FileEditor projectId={projectId} />
    </div>
  );
};

export default ProjectView;
```

### 5. 配置 Monaco Editor Webpack 插件（如需要）
如果遇到打包问题，更新 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // 其他别名...
    },
  },
  optimizeDeps: {
    include: ['monaco-editor'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor', '@monaco-editor/react'],
        },
      },
    },
  },
});
```

### 6. 创建导出文件
更新 `src/components/business/index.ts`：
```typescript
export { CodeEditor } from './CodeEditor/CodeEditor';
```

更新 `src/features/file-explorer/index.ts`：
```typescript
export { FileEditor } from './components/FileEditor';
// ...其他导出
```

## 期望输出
- ✅ @monaco-editor/react 和 monaco-editor 安装
- ✅ `src/components/business/CodeEditor/CodeEditor.tsx` 编辑器组件
- ✅ `src/features/file-explorer/components/FileEditor.tsx` 文件编辑器容器
- ✅ 语法高亮支持
- ✅ 自动保存快捷键（Ctrl/Cmd + S）
- ✅ 文件修改状态跟踪
- ✅ 保存/撤销/关闭功能
- ✅ 与文件浏览器集成

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 应该看到：
# - 点击文件树中的文件后，右侧显示编辑器
# - 代码有语法高亮
# - 可以编辑代码
# - Ctrl/Cmd + S 保存
# - 显示未保存状态
# - 可以撤销更改和关闭文件
```

## Claude 执行 Prompt

请集成 Monaco Editor 代码编辑器，具体要求如下：

1. **安装依赖**：
   - npm install @monaco-editor/react monaco-editor

2. **创建 CodeEditor 组件**（src/components/business/CodeEditor/CodeEditor.tsx）：
   - 使用 @monaco-editor/react 封装
   - 支持多种编程语言
   - 自动从文件扩展名检测语言
   - 配置编辑器选项：
     - minimap, fontSize, wordWrap, automaticLayout
   - 注册 Ctrl/Cmd + S 保存快捷键
   - 支持 vs-dark 和 light 主题
   - 支持只读模式

3. **创建 FileEditor 容器组件**（src/features/file-explorer/components/FileEditor.tsx）：
   - Header 工具栏：
     - 文件名和路径
     - 文件大小和修改时间
     - 未保存状态标签
     - 撤销更改按钮
     - 保存按钮
     - 关闭按钮
   - 集成 CodeEditor
   - 加载文件内容（调用 fileApi.getFileContent）
   - 跟踪文件修改状态（isDirty）
   - 保存文件功能
   - 关闭前提示未保存更改

4. **集成到 ProjectView**（src/pages/ProjectView/index.tsx）：
   - 渲染 FileEditor 组件
   - 传递 projectId

5. **Vite 配置优化**（vite.config.ts）：
   - optimizeDeps 包含 monaco-editor
   - manualChunks 分离 monaco-editor

6. **创建导出文件**

7. **验证**：
   - 编辑器正确加载
   - 语法高亮正常
   - 快捷键保存正常
   - 修改状态跟踪正确
   - 文件加载和保存正常

确保 Monaco Editor 集成完整、功能正常、性能良好。
