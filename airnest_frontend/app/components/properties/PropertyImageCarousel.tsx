'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { PropertyImage } from '@/app/constants/propertyType';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useEffect, useState, useCallback, useRef } from 'react';

interface ImageCarouselProps {
  images: PropertyImage[];
  title: string;
}

const ImageCarousel = ({ images, title }: ImageCarouselProps) => {
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [currentFullscreenIndex, setCurrentFullscreenIndex] = useState<number>(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  
  // 图片加载状态 - 简化为仅跟踪加载完成的图片
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  
  // Swiper 实例引用
  const swiperRef = useRef<any>(null);
  
  // 获取屏幕尺寸 - 使用客户端检测，避免服务端不匹配
  const getScreenWidth = () => {
    return typeof window !== 'undefined' ? window.innerWidth : 1024;
  };

  // 简化的尺寸监听 - 只在需要时获取，避免状态更新
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const handleResize = () => {
      forceUpdate({}); // 强制重新渲染以获取新的屏幕尺寸
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // 监听ESC键关闭全屏模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreenMode) {
        setFullscreenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullscreenMode]);

  // 简化的滑动事件处理
  const handleSlideChange = useCallback((swiper: any) => {
    setCurrentSlideIndex(swiper.activeIndex);
  }, []);

  // 图片加载完成回调
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  }, []);

  const getOptimalImageSize = (index: number) => {
    const screenWidth = getScreenWidth();

    // 根据屏幕尺寸和图片位置决定尺寸
    if (screenWidth >= 2560) {
      return { width: 2400, height: 1800, quality: index === 0 ? 95 : 90 };
    }
    
    if (screenWidth >= 1440) {
      return { width: 1600, height: 1200, quality: index === 0 ? 90 : 85 };
    }
    
    if (screenWidth >= 768) {
      return { width: 1200, height: 900, quality: 85 };
    }
    
    // 移动设备
    return { width: 800, height: 600, quality: 80 };
  };

  // 处理点击轮播图展示全屏大图
  const openFullscreenImage = (index: number) => {
    setCurrentFullscreenIndex(index);
    setFullscreenMode(true);
    // 阻止滚动
    document.body.style.overflow = 'hidden';
  };

  // 关闭全屏大图
  const closeFullscreenImage = () => {
    setFullscreenMode(false);
    // 恢复滚动
    document.body.style.overflow = 'auto';
  };

  // 全屏模式下的导航
  const goToPrevImage = () => {
    setCurrentFullscreenIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNextImage = () => {
    setCurrentFullscreenIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };


  return (
    <>
      <div className="relative mb-4 w-full h-[75vh] rounded-xl overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{
            clickable: true,
          }}
          autoplay={{
            delay: 4000, 
            disableOnInteraction: false,
          }}
          loop={true}
          className="h-full w-full"
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={handleSlideChange}
          onInit={handleSlideChange} 
        >
          {images && images.length > 0 ? (
            images.map((image, index) => (
              <SwiperSlide key={index}>
                <div 
                  className="relative w-full h-full cursor-pointer bg-gradient-to-br from-gray-200 to-gray-300"
                  onClick={() => openFullscreenImage(index)}
                >
                  <Image
                    src={image.imageURL}
                    alt={image.alt_text || `${title} - Image ${index + 1}`}
                    fill
                    className={`object-cover transition-opacity duration-500 ease-in-out ${
                      loadedImages.has(index) ? 'opacity-100' : 'opacity-0'
                    }`}
                    priority={index === 0}
                    loading={index <= 2 ? 'eager' : 'lazy'}
                    sizes="(max-width: 768px) 100vw, (max-width: 1440px) 100vw, (max-width: 2560px) 100vw, 100vw"
                    quality={getOptimalImageSize(index).quality}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => {
                      console.warn(`Failed to load image ${index + 1}`);
                    }}
                  />
                  
                  {/* 悬浮提示层 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                    <span className="text-white opacity-0 hover:opacity-100 text-sm font-medium">
                      点击查看大图
                    </span>
                  </div>
                </div>
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide>
              <div className="relative w-full h-full bg-gradient-to-br from-gray-200 to-gray-300">
                <Image src="/placeholder.jpg" alt={title} fill className="object-cover" priority />
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      </div>

      {/* 全屏大图模式 */}
      {fullscreenMode && images && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="absolute top-4 right-4 z-10">
            <button 
              onClick={closeFullscreenImage}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 p-3 rounded-full transition-all"
              aria-label="关闭大图"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2">
            <button 
              onClick={goToPrevImage}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 p-3 rounded-full transition-all"
              aria-label="上一张"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2">
            <button 
              onClick={goToNextImage}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 p-3 rounded-full transition-all"
              aria-label="下一张"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="relative w-[90vw] h-[90vh]">
            <Image
              src={images[currentFullscreenIndex].imageURL}
              alt={images[currentFullscreenIndex].alt_text || `${title} - 大图 ${currentFullscreenIndex + 1}`}
              fill
              className="object-contain"
              quality={95}
              sizes="90vw"
            />
          </div>
          
          <div className="absolute bottom-4 text-white text-center w-full">
            <p className="text-sm">
              {currentFullscreenIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCarousel;
