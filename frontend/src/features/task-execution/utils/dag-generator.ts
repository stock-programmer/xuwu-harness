import type { TaskNode } from '@/types/task.types';

export interface DAGGeneratorOptions {
  showStatus?: boolean;
  highlightPath?: string[];
}

/**
 * Generate Mermaid DAG code from task list
 */
export const generateMermaidDAG = (
  tasks: TaskNode[],
  options: DAGGeneratorOptions = {}
): string => {
  const { showStatus = true, highlightPath = [] } = options;

  // Mermaid chart header
  let mermaid = 'graph TD\n';

  // Define node style
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

  // Add all nodes
  tasks.forEach((task) => {
    mermaid += `  ${getNodeStyle(task)}\n`;
  });

  // Add dependency relationships (edges)
  tasks.forEach((task) => {
    const fromId = task.id.replace(/[.-]/g, '_');
    task.dependencies.forEach((depId) => {
      const toId = depId.replace(/[.-]/g, '_');
      mermaid += `  ${toId} --> ${fromId}\n`;
    });
  });

  // Add style definitions
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
 * Generate Mermaid DAG from tasks-index.json
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

  // Add Layer styles
  const totalLayers = Object.keys(tasksIndex.layers).length;
  for (let i = 1; i <= totalLayers; i++) {
    const hue = (i * 360) / totalLayers;
    mermaid += `  classDef layer${i} fill:hsl(${hue},70%,80%),stroke:hsl(${hue},70%,50%)\n`;
  }

  return mermaid;
};
