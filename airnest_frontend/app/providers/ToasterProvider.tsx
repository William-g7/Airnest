'use client';

import { Toaster } from 'react-hot-toast';

const ToasterProvider = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // 重写默认样式
        style: {
          background: 'transparent',
          border: 'none',
          padding: '0',
          boxShadow: 'none',
        },
        // 成功toast配置 - 自定义样式
        success: {
          duration: 3000,
          style: {
            background: '#FF5A5F',
            color: '#fff',
            fontWeight: '500',
            minWidth: '300px',
            maxWidth: '500px',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            border: 'none',
            margin: '0',
            backgroundImage: 'none',
            backgroundClip: 'border-box',
            position: 'relative',
            zIndex: '9999',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#FF5A5F',
          },
        },
        // 错误toast配置
        error: {
          duration: 4000,
          style: {
            background: '#222222',
            color: '#fff',
            fontWeight: '500',
            minWidth: '300px',
            maxWidth: '500px',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            border: 'none',
            margin: '0',
            backgroundImage: 'none',
            backgroundClip: 'border-box',
            position: 'relative',
            zIndex: '9999',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#222222',
          },
        },
      }}
    />
  );
};

export default ToasterProvider;
