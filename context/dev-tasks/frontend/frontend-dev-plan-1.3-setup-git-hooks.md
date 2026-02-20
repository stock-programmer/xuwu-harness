# Task: 配置 Husky + lint-staged Git 钩子

## 元数据
- **Task ID**: frontend-dev-plan-1.3
- **Layer**: 1
- **Dependencies**: 无
- **Parallel Group**: [1.1, 1.2, 1.3]
- **Estimated Complexity**: Low

## 目标
配置 Husky 管理 Git hooks，配置 lint-staged 在提交前自动检查和格式化代码，确保提交的代码符合规范。

## 前置条件
- Git 已初始化（如果没有则需要先 `git init`）

## 实现步骤

### 1. 初始化 Git（如果还没有）
```bash
cd frontend
git init
```

### 2. 安装依赖
```bash
npm install -D husky lint-staged
```

### 3. 初始化 Husky
```bash
npx husky install
npm pkg set scripts.prepare="husky install"
```

### 4. 创建 pre-commit hook
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

确保 `.husky/pre-commit` 文件内容为：
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### 5. 配置 lint-staged
在 `package.json` 中添加 lint-staged 配置：
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,json,md}": [
      "prettier --write"
    ]
  }
}
```

### 6. 测试 Git hooks
```bash
# 修改任意文件
echo "// test" >> src/App.tsx

# 提交测试
git add .
git commit -m "test: verify git hooks"
```

应该能看到 lint-staged 自动运行 ESLint 和 Prettier。

## 期望输出
- ✅ `.husky/` 目录创建
- ✅ `.husky/pre-commit` hook 配置完成
- ✅ `package.json` 包含 lint-staged 配置
- ✅ `package.json` 包含 prepare script
- ✅ Git commit 时会自动运行 lint-staged

## 验证标准
```bash
# 修改任意 .ts 或 .tsx 文件
git add .
git commit -m "test"
# 应该触发 lint-staged 并自动格式化代码
```

## Claude 执行 Prompt

请为前端项目配置 Git hooks，在提交代码前自动执行代码检查和格式化，具体要求如下：

1. **初始化 Git**（如果还没有）：
   - 在 frontend 目录下运行 `git init`

2. **安装 Husky 和 lint-staged**：
   - 安装 husky 和 lint-staged 作为开发依赖

3. **配置 Husky**：
   - 运行 `npx husky install` 初始化
   - 在 package.json 中添加 prepare script：`"prepare": "husky install"`
   - 创建 pre-commit hook：`npx husky add .husky/pre-commit "npx lint-staged"`

4. **配置 lint-staged**：
   在 package.json 中添加配置：
   - 对于 .ts 和 .tsx 文件：运行 eslint --fix 和 prettier --write
   - 对于 .css、.json、.md 文件：运行 prettier --write

5. **测试验证**：
   - 修改一个文件（如 src/App.tsx）
   - 使用 `git add .` 和 `git commit -m "test"` 提交
   - 确认 lint-staged 自动运行并格式化了代码

确保 Git hooks 正常工作，每次提交前都会自动检查和格式化代码。
