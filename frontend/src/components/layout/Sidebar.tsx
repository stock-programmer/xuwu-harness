import React from 'react';
import { useParams } from 'react-router-dom';
import { FileExplorer } from '@/features/file-explorer/components/FileExplorer';

export const Sidebar: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="p-4 text-gray-500">
        <p>请选择一个项目</p>
      </div>
    );
  }

  return <FileExplorer projectId={projectId} />;
};
