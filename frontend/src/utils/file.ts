export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf('.') + 1);
};

export const getFileName = (path: string): string => {
  return path.split('/').pop() || '';
};

export const getLanguageFromExtension = (extension: string): string => {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    md: 'markdown',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    rb: 'ruby',
    sh: 'shell',
    bash: 'shell',
    sql: 'sql',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    dockerfile: 'dockerfile',
    txt: 'plaintext',
  };

  return languageMap[extension.toLowerCase()] || 'plaintext';
};
