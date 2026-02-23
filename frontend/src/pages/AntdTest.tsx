import React from 'react';
import { Button, Input, Space, Card, message } from 'antd';

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
