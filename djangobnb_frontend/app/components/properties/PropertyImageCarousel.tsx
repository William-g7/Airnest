'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ImageCarouselProps {
    images: { imageURL: string }[];
    title: string;
}

const ImageCarousel = ({ images, title }: ImageCarouselProps) => {
    return (
        <div className="relative mb-4 w-full h-[64vh] rounded-xl overflow-hidden">
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
                            <div className="relative w-full h-full">
                                <Image
                                    src={image.imageURL}
                                    alt={`${title} - Image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                />
                            </div>
                        </SwiperSlide>
                    ))
                ) : (
                    <SwiperSlide>
                        <div className="relative w-full h-full">
                            <Image
                                src="/placeholder.jpg"
                                alt={title}
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </SwiperSlide>
                )}
            </Swiper>
        </div>
    );
};

export default ImageCarousel;