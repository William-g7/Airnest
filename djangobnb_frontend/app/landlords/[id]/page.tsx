import Image from "next/image";
import ContactButton from "@/app/components/ContactButton";
import PropertyListItem from "@/app/components/properties/PropertyListItem";
import apiService from "@/app/services/apiService";

interface Property {
    id: number;
    title: string;
    price_per_night: number;
    images: Array<{
        imageURL: string;
    }>;
    city: string;
    country: string;
    guests: number;
}

interface Landlord {
    id: string;
    name: string;
    avatar_url: string;
    properties: Property[];
    properties_count: number;
    date_joined: string;
}

const LandlordDetailsPage = async ({ params }: { params: { id: string } }) => {
    const landlord: Landlord = await apiService.get(`/api/auth/landlords/${params.id}/`);
    console.log('landlord info:', landlord);

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="md:col-span-5 lg:col-span-4">
                    <div className="border border-gray-200 rounded-xl p-6 shadow-md">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                                <Image
                                    src={landlord.avatar_url || "/profile_pic_1.jpg"}
                                    alt={landlord.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h1 className="text-2xl font-semibold">{landlord.name}</h1>
                            <p className="text-gray-500">Superhost</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-center space-x-2">
                                <span>📅</span>
                                <span>{new Date().getFullYear() - new Date(landlord.date_joined).getFullYear()} years hosting</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-7 lg:col-span-8">
                    <h2 className="text-2xl font-semibold mb-6">{landlord.name}'s listings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {landlord.properties.map((property: Property) => (
                            <PropertyListItem
                                key={property.id}
                                property={property}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default LandlordDetailsPage;