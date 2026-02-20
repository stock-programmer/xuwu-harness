# Task: 实现 Mermaid DAG 可视化

## 元数据
- **Task ID**: frontend-dev-plan-5.2
- **Layer**: 5
- **Dependencies**: [4.4]
- **Parallel Group**: [5.1, 5.2, 5.3, 5.4, 5.5]
- **Estimated Complexity**: Medium

## 目标
使用 Mermaid.js 实现任务依赖关系的 DAG（有向无环图）可视化，支持节点状态展示、交互式点击等功能。

## 前置条件
- 任务执行模块已实现（Task 4.4 完成）

## 实现步骤

### 1. 安装 Mermaid
```bash
cd frontend
npm install mermaid
npm install --save-dev @types/mermaid
```

### 2. 创建 Mermaid 组件
创建 `src/components/business/MermaidDiagram/MermaidDiagram.tsx`：
```typescript
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Spin } from 'antd';

interface MermaidDiagramProps {
  chart: string;
  onNodeClick?: (nodeId: string) => void;
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  chart,
  onNodeClick,
  theme = 'default',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    // 初始化 Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
    });
  }, [theme]);

  useEffect(() => {
    if (!containerRef.current || !chart) return;

    const renderDiagram = async () => {
      setLoading(true);
      setError(null);

      try {
        // 清空容器
        containerRef.current.innerHTML = '';

        // 生成唯一 ID
        const id = `mermaid-${Date.now()}`;

        // 渲染图表
        const { svg } = await mermaid.render(id, chart);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // 添加节点点击事件
          if (onNodeClick) {
            const nodes = containerRef.current.querySelectorAll('.node');
            nodes.forEach((node) => {
              const nodeId = node.id.replace('flowchart-', '').replace(/-\d+$/, '');
              node.addEventListener('click', () => onNodeClick(nodeId));
              (node as HTMLElement).style.cursor = 'pointer';
            });
          }
        }

        setLoading(false);
      } catch (error: any) {
        console.error('Mermaid rendering error:', error);
        setError(error.message || '渲染失败');
        setLoading(false);
      }
    };

    renderDiagram();
  }, [chart, onNodeClick]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="渲染 DAG..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>渲染失败: {error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container w-full h-full overflow-auto p-4"
      style={{ minHeight: '400px' }}
    />
  );
};
```

### 3. 创建 DAG 生成工具
创建 `src/features/task-execution/utils/dag-generator.ts`：
```typescript
import { TaskNode } from '@/types/task.types';

export interface DAGGeneratorOptions {
  showStatus?: boolean;
  highlightPath?: string[];
}

/**
 * 从任务列表生成 Mermaid DAG 代码
 */
export const generateMermaidDAG = (
  tasks: TaskNode[],
  options: DAGGeneratorOptions = {}
): string => {
  const { showStatus = true, highlightPath = [] } = options;

  // Mermaid 图表头部
  let mermaid = 'graph TD\n';

  // 定义节点样式
  const getNodeStyle = (task: TaskNode): string => {
    const baseId = task.id.replace(/[.-]/g, '_');

    if (!showStatus) {
      return `${baseId}["${task.metadata.name}"]`;
    }

    const statusStyles: Record<string, string> = {
      pending: ':::pending',
      running: ':::running',
      completed: ':::completed',
      failed: ':::failed',
      skipped: ':::skipped',
    };

    const style = statusStyles[task.status] || '';
    const isHighlighted = highlightPath.includes(task.id);

    return `${baseId}["${task.metadata.name}<br/>${task.status}"]${style}${
      isHighlighted ? ':::highlighted' : ''
    }`;
  };

  // 添加所有节点
  tasks.forEach((task) => {
    mermaid += `  ${getNodeStyle(task)}\n`;
  });

  // 添加依赖关系（边）
  tasks.forEach((task) => {
    const fromId = task.id.replace(/[.-]/g, '_');
    task.dependencies.forEach((depId) => {
      const toId = depId.replace(/[.-]/g, '_');
      mermaid += `  ${toId} --> ${fromId}\n`;
    });
  });

  // 添加样式定义
  if (showStatus) {
    mermaid += `
  classDef pending fill:#d9d9d9,stroke:#999,color:#000
  classDef running fill:#1890ff,stroke:#096dd9,color:#fff
  classDef completed fill:#52c41a,stroke:#389e0d,color:#fff
  classDef failed fill:#ff4d4f,stroke:#cf1322,color:#fff
  classDef skipped fill:#faad14,stroke:#d48806,color:#000
  classDef highlighted stroke:#722ed1,stroke-width:4px
`;
  }

  return mermaid;
};

/**
 * 从 tasks-index.json 生成 Mermaid DAG
 */
export const generateDAGFromIndex = (tasksIndex: any): string => {
  let mermaid = 'graph TD\n';

  Object.values(tasksIndex.layers).forEach((layer: any) => {
    layer.tasks.forEach((task: any) => {
      const nodeId = task.id.replace(/[.-]/g, '_');
      mermaid += `  ${nodeId}["${task.name}"]:::layer${layer.layer_num}\n`;

      task.dependencies.forEach((depId: string) => {
        const depNodeId = depId.replace(/[.-]/g, '_');
        mermaid += `  ${depNodeId} --> ${nodeId}\n`;
      });
    });
  });

  // 添加 Layer 样式
  const totalLayers = Object.keys(tasksIndex.layers).length;
  for (let i = 1; i <= totalLayers; i++) {
    const hue = (i * 360) / totalLayers;
    mermaid += `  classDef layer${i} fill:hsl(${hue},70%,80%),stroke:hsl(${hue},70%,50%)\n`;
  }

  return mermaid;
};
```

### 4. 创建 DAG 可视化组件
创建 `src/features/task-execution/components/DAGVisualization.tsx`：
```typescript
import React, { useMemo } from 'react';
import { Card, Typography, Space, Button, Select, Switch } from 'antd';
import { ExpandOutlined, DownloadOutlined } from '@ant-design/icons';
import { MermaidDiagram } from '@/components/business/MermaidDiagram/MermaidDiagram';
import { useTaskExecutionStore } from '../store/task-execution.store';
import { generateMermaidDAG } from '../utils/dag-generator';

const { Title } = Typography;

interface DAGVisualizationProps {
  onNodeClick?: (taskId: string) => void;
}

export const DAGVisualization: React.FC<DAGVisualizationProps> = ({
  onNodeClick,
}) => {
  const { tasks } = useTaskExecutionStore();
  const [showStatus, setShowStatus] = React.useState(true);
  const [theme, setTheme] = React.useState<'default' | 'dark' | 'forest' | 'neutral'>('default');

  const mermaidCode = useMemo(() => {
    return generateMermaidDAG(tasks, { showStatus });
  }, [tasks, showStatus]);

  const handleDownloadSVG = () => {
    const svg = document.querySelector('.mermaid-container svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `dag-${Date.now()}.svg`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const handleFullscreen = () => {
    const container = document.querySelector('.mermaid-container');
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  return (
    <Card className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="m-0 mb-2">
            任务依赖关系（DAG）
          </Title>
          <Space size="small">
            <span className="text-sm text-gray-500">节点数: {tasks.length}</span>
            <Switch
              checkedChildren="显示状态"
              unCheckedChildren="隐藏状态"
              checked={showStatus}
              onChange={setShowStatus}
              size="small"
            />
          </Space>
        </div>

        <Space>
          <Select
            value={theme}
            onChange={setTheme}
            size="small"
            style={{ width: 100 }}
          >
            <Select.Option value="default">默认</Select.Option>
            <Select.Option value="dark">深色</Select.Option>
            <Select.Option value="forest">森林</Select.Option>
            <Select.Option value="neutral">中性</Select.Option>
          </Select>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadSVG}
            size="small"
          >
            下载 SVG
          </Button>

          <Button
            icon={<ExpandOutlined />}
            onClick={handleFullscreen}
            size="small"
          >
            全屏
          </Button>
        </Space>
      </div>

      {/* DAG */}
      <div className="border border-gray-200 rounded overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
        <MermaidDiagram
          chart={mermaidCode}
          onNodeClick={onNodeClick}
          theme={theme}
        />
      </div>
    </Card>
  );
};
```

### 5. 在 TaskDashboard 中集成
更新 `src/features/task-execution/components/TaskDashboard.tsx`，添加 DAG 可视化选项卡：
```typescript
import { Tabs } from 'antd';
import { DAGVisualization } from './DAGVisualization';

// 在 TaskDashboard 组件中添加：
const items = [
  {
    key: 'layers',
    label: 'Layer 视图',
    children: (
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {layersArray.map((layer) => (
          <LayerPanel key={layer.layerNum} layer={layer} />
        ))}
      </div>
    ),
  },
  {
    key: 'dag',
    label: 'DAG 视图',
    children: (
      <DAGVisualization
        onNodeClick={(taskId) => {
          console.log('Clicked task:', taskId);
          // 可以跳转到任务详情或高亮显示
        }}
      />
    ),
  },
];

return (
  <div className="h-full flex flex-col">
    {/* ... Header ... */}

    <Tabs items={items} defaultActiveKey="layers" />
  </div>
);
```

### 6. 创建样式文件（可选）
创建 `src/styles/mermaid.css`：
```css
.mermaid-container {
  background: #f5f5f5;
}

.mermaid-container svg {
  max-width: 100%;
  height: auto;
}

.mermaid-container .node rect,
.mermaid-container .node circle,
.mermaid-container .node polygon {
  transition: all 0.3s ease;
}

.mermaid-container .node:hover rect,
.mermaid-container .node:hover circle,
.mermaid-container .node:hover polygon {
  filter: brightness(0.9);
  stroke-width: 2px;
}

/* 全屏样式 */
.mermaid-container:fullscreen {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

在 `src/main.tsx` 中导入：
```typescript
import './styles/mermaid.css';
```

### 7. 创建导出文件
更新 `src/features/task-execution/index.ts`：
```typescript
export { DAGVisualization } from './components/DAGVisualization';
export { generateMermaidDAG, generateDAGFromIndex } from './utils/dag-generator';
// ...其他导出
```

## 期望输出
- ✅ mermaid 安装完成
- ✅ `src/components/business/MermaidDiagram/MermaidDiagram.tsx` 通用组件
- ✅ `src/features/task-execution/utils/dag-generator.ts` DAG 生成工具
- ✅ `src/features/task-execution/components/DAGVisualization.tsx` DAG 可视化组件
- ✅ TaskDashboard 集成 DAG 视图
- ✅ 节点点击交互
- ✅ 下载 SVG 功能
- ✅ 全屏查看功能

## 验证标准
```bash
npm run dev
# 访问项目页面 /project/xxx
# 切换到 DAG 视图选项卡
# 应该看到：
# - 任务依赖关系图
# - 节点显示任务名称和状态
# - 不同状态有不同颜色
# - 可以点击节点
# - 可以下载 SVG
# - 可以全屏查看
```

## Claude 执行 Prompt

请实现 Mermaid DAG 可视化功能，具体要求如下：

1. **安装依赖**：
   - npm install mermaid @types/mermaid

2. **创建 Mermaid 组件**（src/components/business/MermaidDiagram/MermaidDiagram.tsx）：
   - 封装 mermaid.js
   - 支持多种主题（default/dark/forest/neutral）
   - 渲染 Mermaid 图表
   - 添加节点点击事件监听
   - 错误处理和加载状态

3. **创建 DAG 生成工具**（src/features/task-execution/utils/dag-generator.ts）：
   - generateMermaidDAG: 从 TaskNode[] 生成 Mermaid 代码
   - 支持显示/隐藏状态
   - 节点样式根据状态设置颜色
   - 生成依赖关系边
   - 添加样式类定义

4. **创建 DAG 可视化组件**（src/features/task-execution/components/DAGVisualization.tsx）：
   - Header 工具栏：
     - 节点数统计
     - 显示/隐藏状态开关
     - 主题选择器
     - 下载 SVG 按钮
     - 全屏按钮
   - 集成 MermaidDiagram
   - 节点点击处理

5. **集成到 TaskDashboard**：
   - 添加 Tabs 组件
   - Layer 视图和 DAG 视图切换
   - 传递节点点击回调

6. **创建样式文件**（src/styles/mermaid.css）：
   - 节点 hover 效果
   - 全屏样式
   - 在 main.tsx 中导入

7. **创建导出文件**

8. **验证**：
   - DAG 正确渲染
   - 节点点击正常
   - 下载和全屏功能正常
   - 主题切换正常

确保 DAG 可视化功能完整、交互流畅、视觉效果好。
