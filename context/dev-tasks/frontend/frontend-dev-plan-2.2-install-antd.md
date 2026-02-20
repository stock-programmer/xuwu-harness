# Task: 安装配置 Ant Design 5.x

## 元数据
- **Task ID**: frontend-dev-plan-2.2
- **Layer**: 2
- **Dependencies**: [1.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6]
- **Estimated Complexity**: Low

## 目标
安装 Ant Design 5.x，配置主题定制，测试组件可用性，确保与 React 18 兼容。

## 前置条件
- 项目已初始化（Task 1.1 完成）
- React 18+ 已安装

## 实现步骤

### 1. 安装 Ant Design
```bash
cd frontend
npm install antd
```

### 2. 创建主题配置文件
创建 `src/config/theme.ts`：
```typescript
import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Button: {
      controlHeight: 36,
    },
    Input: {
      controlHeight: 36,
    },
  },
};
```

### 3. 在 App.tsx 中配置 ConfigProvider
更新 `src/App.tsx`：
```typescript
import React from 'react';
import { ConfigProvider, Button, Space, Typography } from 'antd';
import { theme } from './config/theme';

const { Title } = Typography;

function App() {
  return (
    <ConfigProvider theme={theme}>
      <div style={{ padding: 24 }}>
        <Space direction="vertical" size="large">
          <Title level={2}>Ant Design 5.x Test</Title>
          <Space>
            <Button type="primary">Primary Button</Button>
            <Button>Default Button</Button>
            <Button type="dashed">Dashed Button</Button>
            <Button type="link">Link Button</Button>
          </Space>
        </Space>
      </div>
    </ConfigProvider>
  );
}

export default App;
```

### 4. 测试常用组件
创建测试页面 `src/pages/AntdTest.tsx`：
```typescript
import React from 'react';
import {
  Button,
  Input,
  Space,
  Typography,
  Card,
  Table,
  Tree,
  Layout,
  Modal,
  message,
} from 'antd';

const { Title } = Typography;

export const AntdTest: React.FC = () => {
  const showMessage = () => {
    message.success('Ant Design is working!');
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Button Components">
        <Space>
          <Button type="primary">Primary</Button>
          <Button>Default</Button>
          <Button danger>Danger</Button>
        </Space>
      </Card>

      <Card title="Input Components">
        <Input placeholder="Test input" />
      </Card>

      <Card title="Message">
        <Button onClick={showMessage}>Show Message</Button>
      </Card>
    </Space>
  );
};
```

### 5. 配置按需加载（已自动支持）
Ant Design 5.x 默认支持 tree-shaking，无需额外配置。

## 期望输出
- ✅ `antd` 安装成功
- ✅ 主题配置文件创建（`src/config/theme.ts`）
- ✅ ConfigProvider 配置完成
- ✅ Ant Design 组件可以正常渲染
- ✅ 主题自定义生效

## 验证标准
```bash
npm run dev
# 访问 http://localhost:5173
# 应该看到 Ant Design 样式的按钮和其他组件
# 点击按钮应该有 Ant Design 的交互效果
```

## Claude 执行 Prompt

请为前端项目安装和配置 Ant Design 5.x，具体要求如下：

1. **安装 Ant Design**：
   - 安装最新版本的 antd（5.x）

2. **创建主题配置**：
   - 创建 `src/config/theme.ts`
   - 配置主题 token：
     - colorPrimary: '#1890ff'
     - colorSuccess: '#52c41a'
     - colorWarning: '#faad14'
     - colorError: '#f5222d'
     - borderRadius: 6
     - fontSize: 14
   - 配置组件默认高度：Button 和 Input 都为 36px

3. **配置 ConfigProvider**：
   - 在 `src/App.tsx` 中导入 ConfigProvider 和主题配置
   - 用 ConfigProvider 包裹整个应用
   - 传入自定义主题配置

4. **测试组件**：
   - 在 App.tsx 中测试以下组件：
     - Button（primary、default、dashed、link）
     - Typography（Title）
     - Space 布局
   - 创建 `src/pages/AntdTest.tsx` 测试更多组件：
     - Input
     - Card
     - Message
     - Modal

5. **验证**：
   - 运行 `npm run dev`
   - 确认所有 Ant Design 组件正常渲染
   - 确认自定义主题生效（颜色、圆角等）
   - 确认组件交互正常（点击、输入等）

确保 Ant Design 5.x 与 React 18 完全兼容，所有组件可正常使用。
