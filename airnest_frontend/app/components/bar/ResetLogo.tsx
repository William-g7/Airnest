'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/app/stores/searchStore';

const ResetLogo = () => {
  const router = useRouter();
  const { resetFilters } = useSearchStore();

  const handleLogoClick = () => {
    try {
      // 重置搜索过滤器
      resetFilters();
      
      // 导航到首页
      router.push('/');
    } catch (error) {
      console.error('Logo click navigation error:', error);
      // 如果Zustand store失败，至少确保导航能工作
      try {
        window.location.href = '/';
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
      }
    }
  };

  return (
    <div
      className="flex-shrink-0 cursor-pointer transition-transform duration-300"
      onClick={handleLogoClick}
      style={{ transform: `scale(var(--logo-scale, 1))` }}
    >
      <Image 
        src="/logo.png" 
        alt="Airnest" 
        width={100} 
        height={38}
        style={{ width: 'auto', height: 'auto' }}
        priority
      />
    </div>
  );
};

export default ResetLogo;
