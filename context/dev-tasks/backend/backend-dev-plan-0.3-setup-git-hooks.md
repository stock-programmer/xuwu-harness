# Task: 配置 Husky + lint-staged Git 钩子

## 元数据
- **Task ID**: backend-0.3
- **Layer**: 0
- **Dependencies**: []
- **Parallel Group**: [0.1, 0.2, 0.3]
- **Estimated Complexity**: Low

## 目标
配置 Git hooks 管理工具，在代码提交前自动运行 lint 和 format，确保提交的代码符合规范。

## 前置条件
- Git 仓库已初始化
- Node.js 项目已存在

## 实现步骤

### 1. 初始化 Git（如果还没有）
```bash
cd backend
git init
```

### 2. 安装 Husky 和 lint-staged
```bash
npm install -D husky lint-staged
```

### 3. 初始化 Husky
```bash
npx husky install
```

### 4. 配置 package.json 的 prepare script
在 `package.json` 中添加：
```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

### 5. 创建 pre-commit hook
```bash
npx husky add .husky/pre-commit "npx lint-staged"
chmod +x .husky/pre-commit
```

### 6. 配置 lint-staged
在 `package.json` 中添加：
```json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## 期望输出

### 目录结构
```
backend/
├── .husky/
│   ├── _/
│   └── pre-commit
├── package.json (包含 prepare 和 lint-staged 配置)
└── ...
```

### 新增依赖
- husky
- lint-staged

### Git Hooks
- `.husky/pre-commit`: 提交前自动执行 lint-staged

## 验证标准

### 1. Husky 安装验证
```bash
ls -la .husky/
```
预期：存在 `.husky/` 目录和 `pre-commit` 文件

### 2. Pre-commit Hook 验证
修改任意 `.ts` 文件，添加一些格式问题，然后：
```bash
git add .
git commit -m "test commit"
```
预期：自动运行 ESLint 和 Prettier，修复格式问题

### 3. Hook 阻止提交验证
创建一个有严重 lint 错误的文件，尝试提交：
预期：提交被阻止，显示错误信息

## Claude 执行 Prompt

请在 backend 目录下执行以下任务：

1. 检查是否已初始化 Git 仓库，如果没有则运行 `git init`

2. 安装依赖：
   - husky
   - lint-staged

3. 初始化 Husky：
   - 运行 `npx husky install`

4. 在 package.json 中添加 prepare script：
   ```json
   "prepare": "husky install"
   ```

5. 创建 pre-commit hook：
   - 运行 `npx husky add .husky/pre-commit "npx lint-staged"`
   - 确保 pre-commit 文件有执行权限

6. 在 package.json 中配置 lint-staged：
   ```json
   "lint-staged": {
     "*.ts": [
       "eslint --fix",
       "prettier --write"
     ]
   }
   ```

7. 验证配置：
   - 修改 src/index.ts，添加一些格式不规范的代码
   - 运行 `git add .`
   - 运行 `git commit -m "test: verify git hooks"`
   - 确认 lint-staged 自动运行并修复格式问题

确保 Git hooks 正常工作，提交时会自动检查和修复代码格式。
