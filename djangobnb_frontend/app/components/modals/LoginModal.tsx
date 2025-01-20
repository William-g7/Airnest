'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginModal } from "../hooks/useLoginModal";
import { handleLogin } from "@/app/lib/action";
import Modal from "./Modal";
import CustomButton from "../forms/CustomButton";
import apiService from "@/app/services/apiService";

export default function LoginModal() {
    const loginModal = useLoginModal();
    const router = useRouter();
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

            const response = await apiService.post('/api/auth/login/', {
                email: formData.email,
                password: formData.password
            });

            if (response.access) {
                await handleLogin(response.user.pk, response.access, response.refresh);
                loginModal.onClose();
                await router.refresh();
                router.push('/');
            } else {
                setError("Login failed. Please try again.");
            }
        } catch (error: any) {
            setError(error.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    }

    const content = (
        <div className="flex flex-col gap-4">
            <h2 className="mb-4 text-2xl font-bold">Please Login</h2>

            {error && (
                <div className="p-3 text-sm bg-red-100 text-red-600 rounded-lg">
                    {error}
                </div>
            )}
            <form className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        email: e.target.value
                    }))}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        password: e.target.value
                    }))}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                />
                <CustomButton
                    label={isLoading ? "Loading..." : "Login"}
                    onClick={() => {
                        onSubmit();
                    }}
                />
            </form>
        </div>
    );

    return (
        <Modal
            label="Login"
            isOpen={loginModal.isOpen}
            close={loginModal.onClose}
            content={content}
        />
    );
}