'use client'

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSignupModal } from "../hooks/useSignupModal";
import { useLoginModal } from "../hooks/useLoginModal";

import Modal from "./Modal";
import CustomButton from "../forms/CustomButton";
import apiService from "@/app/services/apiService";
import { handleLogin } from "@/app/auth/session";
import { useTranslations } from 'next-intl';

export default function SignupModal() {
    const t = useTranslations('auth');
    const router = useRouter();
    const signupModal = useSignupModal();
    const loginModal = useLoginModal();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        password2: ''
    });

    const onSubmit = async () => {
        try {
            setIsLoading(true);
            setError("");

            if (formData.password !== formData.password2) {
                setError(t('passwordsNotMatch'));
                return;
            }

            const response = await apiService.postwithouttoken('/api/auth/register/', {
                email: formData.email,
                password1: formData.password,
                password2: formData.password2
            });

            if (response.access) {
                handleLogin(response.user_pk, response.access, response.refresh);
                signupModal.onClose();
                router.push('/');
            } else {
                setError(t('somethingWentWrong'));
            }
        } catch (error: any) {
            setError(error.message || t('somethingWentWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <div className="flex flex-col gap-4">
            <h2 className="mb-4 text-2xl font-bold">{t('createAccount')}</h2>

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
                    disabled={isLoading}
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
                    disabled={isLoading}
                />

                <input
                    type="password"
                    placeholder={t('confirmPassword')}
                    value={formData.password2}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        password2: e.target.value
                    }))}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                    disabled={isLoading}
                />

                <CustomButton
                    label={isLoading ? t('loading') : t('signup')}
                    onClick={onSubmit}
                    disabled={isLoading}
                />
            </form>

            <div className="text-center text-gray-500 text-sm">
                {t('alreadyHaveAccount')}{" "}
                <button
                    onClick={() => {
                        signupModal.onClose();
                        loginModal.onOpen();
                    }}
                    className="text-airbnb hover:underline"
                >
                    {t('login')}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            label={t('signup')}
            isOpen={signupModal.isOpen}
            close={signupModal.onClose}
            content={content}
        />
    );
}