'use client';

import { useEffect } from 'react';
import { initCsrfToken } from '@/app/services/csrfService';

export function ClientSideCsrfInitializer() {
    useEffect(() => {
        const initCsrf = async () => {
            try {
                await initCsrfToken();
                console.log('CSRF token initialized');
            } catch (error) {
                console.error('Failed to initialize CSRF token:', error);
            }
        };

        initCsrf();
    }, []);

    return null;
} 