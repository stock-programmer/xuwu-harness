# Task: 配置 TailwindCSS + PostCSS

## 元数据
- **Task ID**: frontend-dev-plan-2.1
- **Layer**: 2
- **Dependencies**: [1.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6]
- **Estimated Complexity**: Low

## 目标
安装并配置 TailwindCSS 及其依赖，配置 PostCSS，创建全局样式文件，验证 Tailwind 类名可以正常使用。

## 前置条件
- 项目已初始化（Task 1.1 完成）
- package.json 已存在

## 实现步骤

### 1. 安装 TailwindCSS 和相关依赖
```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. 配置 tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
        success: '#52c41a',
        warning: '#faad14',
        error: '#f5222d',
      },
    },
  },
  plugins: [],
}
```

### 3. 配置 PostCSS
确保 `postcss.config.js` 包含：
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 4. 创建全局样式文件
创建 `src/styles/tailwind.css`：
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom global styles */
@layer base {
  body {
    @apply font-sans antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded hover:opacity-90 transition-opacity;
  }
}
```

### 5. 在 main.tsx 中导入样式
更新 `src/main.tsx`：
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/tailwind.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 6. 测试 Tailwind 类名
在 `src/App.tsx` 中测试：
```typescript
function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-blue-500 mb-4">
          Hello Tailwind!
        </h1>
        <button className="btn-primary">
          Test Button
        </button>
      </div>
    </div>
  )
}

export default App
```

## 期望输出
- ✅ `tailwind.config.js` 配置完成
- ✅ `postcss.config.js` 配置完成
- ✅ `src/styles/tailwind.css` 创建
- ✅ Tailwind 类名可以使用并生效
- ✅ 自定义主题颜色配置成功

## 验证标准
```bash
npm run dev
# 访问 http://localhost:5173
# 应该看到蓝色标题和样式化的按钮
```

## Claude 执行 Prompt

请为前端项目配置 TailwindCSS，具体要求如下：

1. **安装依赖**：
   - 安装 tailwindcss、postcss、autoprefixer
   - 运行 `npx tailwindcss init -p` 生成配置文件

2. **配置 Tailwind**（tailwind.config.js）：
   - 设置 content 路径：`["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`
   - 扩展主题，添加自定义颜色：primary、success、warning、error
   - 使用 Ant Design 的配色方案

3. **配置 PostCSS**（postcss.config.js）：
   - 确保包含 tailwindcss 和 autoprefixer 插件

4. **创建全局样式**：
   - 创建 `src/styles/tailwind.css`
   - 导入 Tailwind 的 base、components、utilities
   - 添加自定义组件类（如 btn-primary）
   - 设置全局基础样式（字体、抗锯齿等）

5. **集成到应用**：
   - 在 `src/main.tsx` 中导入 `./styles/tailwind.css`
   - 修改 `src/App.tsx` 测试 Tailwind 类名是否生效

6. **验证**：
   - 运行 `npm run dev`
   - 确认 Tailwind 类名正常工作
   - 确认自定义颜色和组件类可用

确保 Tailwind 样式可以正常应用，并且构建时可以正确 tree-shaking。
