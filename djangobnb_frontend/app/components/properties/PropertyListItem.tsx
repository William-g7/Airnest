import { PropertyType } from "./PropertyList";
import Image from "next/image";

interface PropertyListItemProps {
    property: PropertyType;
}

const PropertyListItem: React.FC<PropertyListItemProps> = ({ property }) => {
    return (
        <div>
            <div className="cursor-pointer">
                <div className="relative overflow-hidden aspect-square rounded-xl">
                    <Image
                        src={property.images?.[0]?.imageURL || '/placeholder.jpg'}
                        alt={property.title}
                        sizes="(max-width: 768px) 768px, (max-width: 1200px) 768px, 768px"
                        fill
                        className="hover:scale-105 transition-all duration-300 ease-in-out object-cover w-full h-full"
                    />
                </div>

                <div className="mt-2">
                    <p className="text-lg font-semibold">{property.title}</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>Location:</strong> {property.city}, {property.country}</p>
                </div>

                <div className="mt-2">
                    <p className="text-sm text-gray-500"><strong>Price:</strong> ${property.price_per_night}</p>
                </div>
            </div>
        </div>
    )
};

export default PropertyListItem;