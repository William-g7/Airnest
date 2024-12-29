'use client'

import { useState } from "react";
import { useSignupModal } from "../hooks/useSignupModal";

import Modal from "./Modal";
import CustomButton from "../forms/CustomButton";

export default function SignupModal() {
    const signupModal = useSignupModal();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const content = (
        <div className="flex flex-col gap-4">
            <h2 className="mb-4 text-2xl font-bold">Please Signup</h2>
            <form className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        username: e.target.value
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
                    label="Signup"
                    onClick={() => {
                        // 处理登录逻辑
                        console.log('Signup with:', formData);
                    }}
                />
            </form>
        </div>
    );

    return (
        <Modal
            label="Signup"
            isOpen={signupModal.isOpen}
            close={signupModal.onClose}
            content={content}
        />
    );
}