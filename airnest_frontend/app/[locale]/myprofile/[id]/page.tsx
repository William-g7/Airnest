'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import apiService from '@/app/services/apiService';
import CustomButton from '@/app/components/forms/CustomButton';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { useErrorHandler } from '@/app/hooks/useErrorHandler';
import { useChangePasswordModal } from '@/app/components/hooks/useChangePasswordModal';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  date_joined: string;
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const t = useTranslations('profile');
  const { handleError, ErrorType, getError } = useErrorHandler();
  const changePasswordModal = useChangePasswordModal();

  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [name, setName] = useState('');

  const MAX_AVATAR_SIZE_MB = 2;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiService.getwithtoken(`/api/auth/profile/${userId}/`, {
          suppressToast: true,
        });
        setProfile(response);
        setName(response.name || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoadError(getError(error) || t('loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return <div className="text-center mt-8">{t('loading')}</div>;
  }

  if (loadError && !profile) {
    return <div className="text-center mt-8 text-red-500">{loadError}</div>;
  }

  if (!profile) {
    return <div className="text-center mt-8">{t('profileNotFound')}</div>;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!ALLOWED_TYPES.includes(file.type)) {
        setFormError(t('avatarTypeLimit'));
        toast.error(t('avatarTypeLimit'));
        return;
      }

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_AVATAR_SIZE_MB) {
        setFormError(t('avatarSizeLimit', { maxSizeMB: MAX_AVATAR_SIZE_MB }));
        toast.error(t('avatarSizeLimit', { maxSizeMB: MAX_AVATAR_SIZE_MB }));
        return;
      }

      setFormError('');
      setNewAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');

    try {
      const formData = new FormData();
      const nameChanged = name !== profile?.name;
      const avatarChanged = !!newAvatar;

      if (nameChanged) {
        formData.append('name', name);
      }
      if (avatarChanged) {
        formData.append('avatar', newAvatar);
      }

      const response = await apiService.patch(`/api/auth/profile/${userId}/`, formData, {
        suppressToast: true,
      });

      setProfile(response);
      setName(response.name || '');
      setIsEditing(false);
      setAvatarPreview(null);
      setNewAvatar(null);

      if (avatarChanged && nameChanged) {
        toast.success(t('updateSuccess'));
      } else if (avatarChanged) {
        toast.success(t('avatarUpdateSuccess'));
      } else if (nameChanged) {
        toast.success(t('updateSuccess'));
      }
    } catch (error: any) {
      console.error('Profile update error:', error);

      // 处理API返回的特定字段错误
      if (error.response?.data) {
        const fieldErrors = error.response.data;
        if (typeof fieldErrors === 'object') {
          // 构建错误消息
          const errorKeys = Object.keys(fieldErrors);
          if (errorKeys.length > 0) {
            const firstError = fieldErrors[errorKeys[0]];
            setFormError(Array.isArray(firstError) ? firstError[0] : firstError);
            return;
          }
        }
      }

      // 如果没有特定字段错误，使用错误处理钩子
      const errorMessage = getError(error) || t('updateError');
      setFormError(errorMessage);
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
              <h1 className="text-2xl font-semibold">{t('title')}</h1>
              <CustomButton
                label={isEditing ? t('cancel') : t('editProfile')}
                onClick={() => setIsEditing(!isEditing)}
                className="w-auto px-4 py-2 "
              />
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative w-32 h-32">
                    <Image
                      src={avatarPreview || profile.avatar_url || '/images/default-avatar.png'}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col items-center">
                    <label
                      htmlFor="avatar-upload"
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md cursor-pointer transition"
                    >
                      {t('avatarUpload')}
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {t('avatarSizeLimit', { maxSizeMB: MAX_AVATAR_SIZE_MB })}
                    </p>
                  </div>
                </div>

                {formError && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">
                    {formError}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-500">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div className="flex justify-end">
                  <CustomButton
                    label={t('saveChanges')}
                    type="submit"
                    className="w-auto px-4 py-2"
                    onClick={() => {}}
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

                <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
                  <div className="w-full text-center">
                    <h2 className="text-sm font-medium text-gray-500">{t('name')}</h2>
                    <p className="mt-1 text-lg font-medium">{profile.name || t('notSet')}</p>
                  </div>

                  <div className="w-full text-center">
                    <h2 className="text-sm font-medium text-gray-500">{t('email')}</h2>
                    <p className="mt-1 text-lg font-medium">{profile.email}</p>
                  </div>

                  <div className="w-full text-center">
                    <h2 className="text-sm font-medium text-gray-500">{t('password')}</h2>
                    <div className="mt-1">
                      <button
                        onClick={() => changePasswordModal.onOpen()}
                        className="px-3 py-1 text-sm text-airbnb border border-airbnb rounded-md hover:bg-airbnb hover:text-white transition-colors"
                      >
                        {t('changePassword')}
                      </button>
                    </div>
                  </div>

                  <div className="w-full text-center">
                    <h2 className="text-sm font-medium text-gray-500">{t('memberSince')}</h2>
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
