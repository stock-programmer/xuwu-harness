# Task: 配置 ESLint + Prettier 代码规范

## 元数据
- **Task ID**: backend-0.2
- **Layer**: 0
- **Dependencies**: []
- **Parallel Group**: [0.1, 0.2, 0.3]
- **Estimated Complexity**: Low

## 目标
配置代码质量检查工具 ESLint 和代码格式化工具 Prettier，集成 TypeScript 支持，确保代码规范统一。

## 前置条件
- Node.js 项目已存在
- 已安装 npm

## 实现步骤

### 1. 安装 ESLint 相关依赖
```bash
cd backend
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### 2. 安装 Prettier 及集成插件
```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 3. 创建 .eslintrc.js 配置
创建 `backend/.eslintrc.js`：
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  },
  env: {
    node: true,
    es2020: true,
  },
};
```

### 4. 创建 .prettierrc 配置
创建 `backend/.prettierrc`：
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

### 5. 创建忽略文件
创建 `backend/.eslintignore`：
```
node_modules
dist
coverage
*.config.js
```

创建 `backend/.prettierignore`：
```
node_modules
dist
coverage
package-lock.json
```

### 6. 添加 npm scripts
在 `backend/package.json` 中添加：
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  }
}
```

## 期望输出

### 新增文件
- `.eslintrc.js`
- `.prettierrc`
- `.eslintignore`
- `.prettierignore`

### 新增依赖
- eslint
- @typescript-eslint/parser
- @typescript-eslint/eslint-plugin
- prettier
- eslint-config-prettier
- eslint-plugin-prettier

### 新增 Scripts
- lint
- lint:fix
- format
- format:check

## 验证标准

### 1. ESLint 检查
```bash
cd backend
npm run lint
```
预期：能够正常检查代码，无配置错误

### 2. Prettier 格式化
```bash
npm run format
```
预期：能够格式化所有 TypeScript 文件

### 3. 自动修复验证
创建一个故意不符合规范的测试文件，运行：
```bash
npm run lint:fix
```
预期：自动修复格式问题

## Claude 执行 Prompt

请在 backend 目录下执行以下任务：

1. 安装 ESLint 相关包：
   - eslint
   - @typescript-eslint/parser
   - @typescript-eslint/eslint-plugin

2. 安装 Prettier 相关包：
   - prettier
   - eslint-config-prettier
   - eslint-plugin-prettier

3. 创建 .eslintrc.js 配置文件，包含：
   - 使用 @typescript-eslint/parser
   - 继承 eslint:recommended、plugin:@typescript-eslint/recommended、prettier
   - 配置 prettier/prettier 为 error
   - 设置 @typescript-eslint/no-explicit-any 为 warn
   - 设置环境为 node 和 es2020

4. 创建 .prettierrc 配置文件，包含：
   - semi: true
   - trailingComma: "es5"
   - singleQuote: true
   - printWidth: 100
   - tabWidth: 2

5. 创建 .eslintignore 和 .prettierignore 文件，忽略 node_modules、dist、coverage

6. 在 package.json 中添加脚本：
   - lint: 检查代码
   - lint:fix: 自动修复
   - format: 格式化代码
   - format:check: 检查格式

7. 运行 `npm run lint` 验证配置成功
8. 运行 `npm run format` 验证 Prettier 工作正常

确保所有工具都能正常运行，代码检查和格式化功能都可用。
