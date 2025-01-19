'use client'

import { useState } from "react";
import { useLoginModal } from "../hooks/useLoginModal";

import Modal from "./Modal";
import CustomButton from "../forms/CustomButton";

export default function LoginModal() {
    const loginModal = useLoginModal();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const content = (
        <div className="flex flex-col gap-4">
            <h2 className="mb-4 text-2xl font-bold">Please Login</h2>
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
                    label="Login"
                    onClick={() => {
                        // 处理登录逻辑
                        console.log('Login with:', formData);
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