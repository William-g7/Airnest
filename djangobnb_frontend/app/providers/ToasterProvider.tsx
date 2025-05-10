'use client';

import { Toaster } from 'react-hot-toast';
import { BASE_TOAST_OPTIONS, TOAST_THEME_STYLES } from '../utils/toastStyles';

const ToasterProvider = () => {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                ...BASE_TOAST_OPTIONS,
                success: TOAST_THEME_STYLES.success,
                error: TOAST_THEME_STYLES.error,
            }}
        />
    );
};

export default ToasterProvider; 