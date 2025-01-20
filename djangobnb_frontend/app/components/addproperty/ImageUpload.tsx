'use client'

import { useState } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
    images: string[];
    setImages: (images: string[]) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ images, setImages }) => {
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);

            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImages([...images, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                />
                <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-gray-600 hover:text-gray-900"
                >
                    <div className="p-6">
                        <p>Click to upload images</p>
                        <p className="text-sm text-gray-500">Upload as most 3 images you'd like</p>
                    </div>
                </label>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    {images.map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                                src={image}
                                alt={`Property image ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={() => setImages(images.filter((_, i) => i !== index))}
                                className="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-100"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;