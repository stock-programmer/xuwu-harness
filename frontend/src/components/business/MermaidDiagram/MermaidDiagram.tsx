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
    // Initialize Mermaid
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
        // Clear container
        containerRef.current.innerHTML = '';

        // Generate unique ID
        const id = `mermaid-${Date.now()}`;

        // Render chart
        const { svg } = await mermaid.render(id, chart);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // Add node click events
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
