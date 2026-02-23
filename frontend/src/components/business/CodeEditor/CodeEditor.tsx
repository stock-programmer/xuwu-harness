import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
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

  // 从文件路径自动检测语言
  const detectedLanguage = path
    ? getLanguageFromExtension(path.split('.').pop() || '')
    : language || 'plaintext';

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editorInstance;

    // 注册保存快捷键 (Ctrl/Cmd + S)
    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSave && editorInstance.getValue()) {
        onSave(editorInstance.getValue());
        message.success('文件已保存');
      }
    });

    // 配置编辑器选项
    editorInstance.updateOptions({
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

  const handleEditorChange = (newValue: string | undefined) => {
    onChange?.(newValue);
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
