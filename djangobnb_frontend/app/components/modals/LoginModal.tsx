'use client'

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLoginModal } from "../hooks/useLoginModal";
import { handleLogin } from "@/app/auth/session";
import Modal from "./Modal";
import CustomButton from "../forms/CustomButton";
import apiService from "@/app/services/apiService";
import { useTranslations } from 'next-intl';
import { useAuthStore } from "@/app/stores/authStore";
import toast from "react-hot-toast";
import { useErrorHandler } from "@/app/hooks/useErrorHandler";

export default function LoginModal() {
    const t = useTranslations('auth');
    const loginModal = useLoginModal();
    const router = useRouter();
    const { setAuthenticated } = useAuthStore();
    const { handleError, ErrorType } = useErrorHandler();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const onSubmit = async () => {
        try {
            setIsLoading(true);
            setError("");

            if (!formData.email || !formData.password) {
                setError(t('pleaseCompleteAllFields'));
                return;
            }

            console.log("Attempting login with:", formData.email);

            const response = await apiService.postwithouttoken('/api/auth/login/', {
                email: formData.email,
                password: formData.password
            }, { suppressToast: true });

            console.log("Login response:", response);

            if (response && response.access) {
                await handleLogin(response.user.pk, response.access, response.refresh);
                setAuthenticated(response.user.pk);
                loginModal.onClose();
                toast.success(t('loginSuccess'));
                await router.refresh();
                router.push('/');
            } else {
                console.error("Login failed with response:", response);
                setError(t('loginFailed'));
            }
        } catch (error: any) {
            console.error("Login error:", error);

            if (error.message?.includes(ErrorType.AUTH_INVALID_CREDENTIALS)) {
                setError(t('invalidCredentials'));
            } else if (error.response?.data?.email) {
                setError(error.response.data.email[0]);
            } else if (error.response?.data?.password) {
                setError(error.response.data.password[0]);
            } else if (error.response?.data?.non_field_errors) {
                setError(error.response.data.non_field_errors[0]);
            } else {
                setError(t('loginError'));
                handleError(error);
            }
        } finally {
            setIsLoading(false);
        }
    }

    const content = (
        <div className="flex flex-col gap-4">
            <h2 className="mb-4 text-2xl font-bold">{t('pleaseLogin')}</h2>

            {error && (
                <div className="p-3 text-sm bg-red-100 text-red-600 rounded-lg">
                    {error}
                </div>
            )}
            <form className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder={t('email')}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        email: e.target.value
                    }))}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                />
                <input
                    type="password"
                    placeholder={t('password')}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        password: e.target.value
                    }))}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                />
                <CustomButton
                    label={isLoading ? t('loading') : t('login')}
                    onClick={() => {
                        onSubmit();
                    }}
                />
            </form>
        </div>
    );

    return (
        <Modal
            label={t('login')}
            isOpen={loginModal.isOpen}
            close={loginModal.onClose}
            content={content}
        />
    );
}