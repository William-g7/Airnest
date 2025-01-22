'use client'

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import apiService from '@/app/services/apiService';
import CustomButton from '@/app/components/forms/CustomButton';

interface ProfileData {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
    date_joined: string;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const userId = resolvedParams.id;

    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [newAvatar, setNewAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [name, setName] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiService.getwithtoken(`/api/auth/profile/${userId}/`);
                setProfile(response);
                setName(response.name || '');
            } catch (error) {
                console.error('Error fetching profile:', error);
                setError("Failed to load profile");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    if (isLoading) {
        return <div className="text-center mt-8">Loading...</div>;
    }

    if (error) {
        return <div className="text-center mt-8 text-red-500">{error}</div>;
    }

    if (!profile) {
        return <div className="text-center mt-8">Profile not found</div>;
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const formData = new FormData();
            if (name !== profile?.name) {
                formData.append('name', name);
            }
            if (newAvatar) {
                formData.append('avatar', newAvatar);
            }

            const response = await apiService.patch(`/api/auth/profile/${userId}/`, formData);

            setProfile(response);
            setIsEditing(false);
            setAvatarPreview(null);
            setNewAvatar(null);

            const updatedProfile = await apiService.getwithtoken(`/api/auth/profile/${userId}/`);
            setProfile(updatedProfile);
            setName(updatedProfile.name || '');
        } catch (error: any) {
            console.error('Profile update error:', error);
            setError(error.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-semibold">Profile</h1>
                            <CustomButton
                                label={isEditing ? "Cancel" : "Edit Profile"}
                                onClick={() => setIsEditing(!isEditing)}
                                className="w-auto px-6"
                            />
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative w-32 h-32">
                                        <Image
                                            src={avatarPreview || profile.avatar_url || '/images/default-avatar.png'}
                                            alt="Profile"
                                            fill
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <CustomButton
                                        label={isLoading ? "Saving..." : "Save Changes"}
                                        onClick={() => { }}
                                        disabled={isLoading}
                                        className="w-auto px-6"
                                        type="submit"
                                    />
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="relative w-32 h-32">
                                        <Image
                                            src={profile.avatar_url || '/images/default-avatar.png'}
                                            alt="Profile"
                                            fill
                                            className="rounded-full object-cover"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <h2 className="text-sm font-medium text-gray-500">Name</h2>
                                        <p className="mt-1 text-lg font-medium">{profile.name || 'Not set'}</p>
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-medium text-gray-500">Email</h2>
                                        <p className="mt-1 text-lg font-medium">{profile.email}</p>
                                    </div>

                                    <div>
                                        <h2 className="text-sm font-medium text-gray-500">Member Since</h2>
                                        <p className="mt-1 text-lg font-medium">
                                            {new Date(profile.date_joined).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}