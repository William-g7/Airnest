'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignupModal } from "../hooks/useSignupModal";
import { useLoginModal } from "../hooks/useLoginModal";

import Modal from "./Modal";
import CustomButton from "../forms/CustomButton";
import apiService from "@/app/services/apiService";
import { handleLogin } from "@/app/auth/session";

export default function SignupModal() {
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
                setError("Passwords do not match");
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

                setError("Something went wrong");

            }
        } catch (error: any) {
            setError(error.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <div className="flex flex-col gap-4">
            <h2 className="mb-4 text-2xl font-bold">Create an account</h2>

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
                    disabled={isLoading}
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
                    disabled={isLoading}
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={formData.password2}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        password2: e.target.value
                    }))}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                    disabled={isLoading}
                />

                <CustomButton
                    label={isLoading ? "Loading..." : "Sign up"}
                    onClick={onSubmit}
                    disabled={isLoading}
                />
            </form>

            <div className="text-center text-gray-500 text-sm">
                Already have an account?{" "}
                <button
                    onClick={() => {
                        signupModal.onClose();
                        loginModal.onOpen();
                    }}
                    className="text-airbnb hover:underline"
                >
                    Log in
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            label="Sign up"
            isOpen={signupModal.isOpen}
            close={signupModal.onClose}
            content={content}
        />
    );
}