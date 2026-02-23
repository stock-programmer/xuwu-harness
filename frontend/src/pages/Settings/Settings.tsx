import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

export const Settings: React.FC = () => {
  return (
    <div>
      <Title level={2}>Settings</Title>
      <p>设置页面</p>
    </div>
  );
};
