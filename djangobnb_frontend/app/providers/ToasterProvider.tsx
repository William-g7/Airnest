'use client';

import { Toaster } from 'react-hot-toast';

const ToasterProvider = () => {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                duration: 3000,
                style: {
                    background: '#f7f7f7',
                    color: '#484848',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    fontWeight: '500',
                },
                success: {
                    duration: 3000,
                    style: {
                        background: '#FF5A5F',  // Airbnb 主题色
                        color: '#fff',
                        fontWeight: '500',
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#FF5A5F',
                    }
                },
                error: {
                    duration: 4000,
                    style: {
                        background: '#222222',  // 深黑色
                        color: '#fff',
                        fontWeight: '500',
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#222222',
                    }
                },
            }}
        />
    );
};

export default ToasterProvider; 