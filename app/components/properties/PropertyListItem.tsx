import Image from "next/image";

const PropertyListItem = () => {
    return (
        <div>
            <div className="cursor-pointer">
                <div className="relative overflow-hidden aspect-square rounded-xl ">
                    <Image
                        src="/beach_1.jpg"
                        alt="Beach House"
                        sizes="(max-width: 768px) 768px, (max-width: 1200px) 768px, 768px"
                        fill
                        className="hover:scale-105 transition-all duration-300 ease-in-out object-cover w-full h-full"
                    />
                </div>

                <div className="mt-2">
                    <p className="text-lg font-semibold">Beach House</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>Location:</strong> 123 Main St, Beach City</p>
                </div>
            </div>
        </div>
    )
};

export default PropertyListItem;