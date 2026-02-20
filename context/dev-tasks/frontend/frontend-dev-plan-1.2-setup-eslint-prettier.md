# Task: 配置 ESLint + Prettier 代码规范

## 元数据
- **Task ID**: frontend-dev-plan-1.2
- **Layer**: 1
- **Dependencies**: 无
- **Parallel Group**: [1.1, 1.2, 1.3]
- **Estimated Complexity**: Low

## 目标
配置 ESLint 用于代码质量检查，配置 Prettier 用于代码格式化，并确保二者集成且不冲突。

## 前置条件
- 无（可以与项目初始化并行）

## 实现步骤

### 1. 安装 ESLint 相关依赖
```bash
cd frontend
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-plugin-react eslint-plugin-react-hooks
```

### 2. 安装 Prettier 相关依赖
```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 3. 创建 .eslintrc.cjs 配置文件
```javascript
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prettier/prettier': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### 4. 创建 .prettierrc 配置文件
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 5. 创建 .prettierignore 文件
```
dist
node_modules
.cache
build
public/build
coverage
*.md
```

### 6. 创建 .eslintignore 文件
```
dist
node_modules
.cache
build
public/build
coverage
vite.config.ts
```

### 7. 添加 npm scripts
在 `package.json` 中添加：
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\""
  }
}
```

## 期望输出
- ✅ `.eslintrc.cjs` 配置完成
- ✅ `.prettierrc` 配置完成
- ✅ `.eslintignore` 和 `.prettierignore` 创建
- ✅ `package.json` 包含 lint 和 format 脚本
- ✅ ESLint 和 Prettier 可以正常运行

## 验证标准
```bash
npm run lint      # 应该检查所有 .ts/.tsx 文件
npm run format    # 应该格式化所有文件
npm run lint:fix  # 应该自动修复可修复的问题
```

## Claude 执行 Prompt

请为前端项目配置 ESLint 和 Prettier 代码规范工具，具体要求如下：

1. **安装依赖**：
   - 安装 ESLint 及 TypeScript 插件
   - 安装 React 相关 ESLint 插件
   - 安装 Prettier 及其 ESLint 集成插件

2. **配置 ESLint**（.eslintrc.cjs）：
   - 使用推荐的规则集
   - 启用 TypeScript 和 React 支持
   - 集成 Prettier
   - 关闭与 React 18 不兼容的规则（如 react-in-jsx-scope）
   - 配置合理的规则（any 使用警告而非错误）

3. **配置 Prettier**（.prettierrc）：
   - 使用分号
   - 单引号
   - 行宽 100
   - 2 空格缩进
   - ES5 风格的尾逗号

4. **创建忽略文件**：
   - .eslintignore：忽略 dist、node_modules 等
   - .prettierignore：忽略构建产物和配置文件

5. **添加 npm 脚本**：
   - `lint`：检查代码
   - `lint:fix`：自动修复
   - `format`：格式化代码

确保配置后运行 `npm run lint` 和 `npm run format` 都能正常工作。
