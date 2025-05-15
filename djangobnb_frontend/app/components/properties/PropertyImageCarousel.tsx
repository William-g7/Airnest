'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { PropertyImage } from '@/app/constants/propertyType';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useEffect, useState } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface ImageCarouselProps {
  images: PropertyImage[];
  title: string;
}

const ImageCarousel = ({ images, title }: ImageCarouselProps) => {
  const [screenWidth, setScreenWidth] = useState<number>(1024); // 默认值
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [currentFullscreenIndex, setCurrentFullscreenIndex] = useState<number>(0);

  // 监听屏幕尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      setScreenWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
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

  const getOptimalImageUrl = (image: PropertyImage, index: number) => {
    const defaultImage = '/placeholder.jpg';
    
    if (!image) return defaultImage;

    // 如果是首图且有JPG格式，优先使用高质量JPG
    if (index === 0 && image.mainJpgURL) {
      return image.mainJpgURL;
    }
    
    // 超大屏幕 (4K等高分辨率显示器) 优先使用超高清图片
    if (screenWidth >= 2560) {
      return image.xlargeURL || image.largeURL || image.mediumURL || image.imageURL || defaultImage;
    }
    
    // 大屏幕优先使用高分辨率图片
    if (screenWidth >= 1440) {
      return image.largeURL || image.mediumURL || image.imageURL || defaultImage;
    }
    
    // 中等屏幕使用中等尺寸
    if (screenWidth >= 768) {
      return image.mediumURL || image.imageURL || defaultImage;
    }
    
    // 小屏幕使用中等尺寸或原始尺寸
    return image.mediumURL || image.imageURL || defaultImage;
  };
  
  const getFullscreenImageUrl = (image: PropertyImage) => {
    if (!image) return '/placeholder.jpg';
    return image.originalURL || image.xlargeURL || image.largeURL || image.imageURL || '/placeholder.jpg';
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
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop={true}
          className="h-full w-full "
        >
          {images && images.length > 0 ? (
            images.map((image, index) => (
              <SwiperSlide key={index}>
                <div 
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => openFullscreenImage(index)}
                >
                  <Image
                    src={getOptimalImageUrl(image, index)}
                    alt={`${title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1440px) 100vw, (max-width: 2560px) 100vw, 100vw"
                    quality={index === 0 ? 95 : (screenWidth >= 1440 ? 90 : 85)}
                  />
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
              <div className="relative w-full h-full">
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
              <FaTimes size={24} />
            </button>
          </div>

          <div className="absolute top-1/2 left-4 z-10 transform -translate-y-1/2">
            <button 
              onClick={goToPrevImage}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 p-3 rounded-full transition-all"
              aria-label="上一张"
            >
              <FaChevronLeft size={24} />
            </button>
          </div>

          <div className="absolute top-1/2 right-4 z-10 transform -translate-y-1/2">
            <button 
              onClick={goToNextImage}
              className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 p-3 rounded-full transition-all"
              aria-label="下一张"
            >
              <FaChevronRight size={24} />
            </button>
          </div>

          <div className="relative w-[90vw] h-[90vh]">
            <Image
              src={getFullscreenImageUrl(images[currentFullscreenIndex])}
              alt={`${title} - 大图 ${currentFullscreenIndex + 1}`}
              fill
              className="object-contain"
              quality={100}
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
