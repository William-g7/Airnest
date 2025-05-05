import Image from "next/image";
import ContactButton from "@/app/components/ContactButton";
import PropertyListItem from "@/app/components/properties/PropertyListItem";
import apiService from "@/app/services/apiService";
import { getTranslations } from 'next-intl/server';
import { PropertyType } from "@/app/constants/propertyType";

interface Landlord {
    id: string;
    name: string;
    avatar_url: string;
    properties: PropertyType[];
    properties_count: number;
    date_joined: string;
}

const LandlordDetailsPage = async ({ params }: { params: { id: string, locale: string } }) => {
    const landlord: Landlord = await apiService.get(`/api/auth/landlords/${params.id}/`);
    const t = await getTranslations('landlord');

    const hostingYears = new Date().getFullYear() - new Date(landlord.date_joined).getFullYear() + 1;

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8">
                {/* Left Column */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="border border-gray-200 rounded-xl p-6 shadow-md sticky top-24">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative w-28 h-28 rounded-full overflow-hidden mb-4">
                                <Image
                                    src={landlord.avatar_url || "/profile_pic_1.jpg"}
                                    alt={landlord.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h1 className="text-xl font-semibold">{landlord.name}</h1>
                            <div className="flex items-center mt-1 text-sm">
                                <span className="text-rose-500">★</span>
                                <p className="text-gray-500 ml-1">{t('superhost')}</p>
                            </div>
                        </div>

                        <hr className="my-4" />

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-500">📅</span>
                                <span className="text-gray-700">{t('yearsHosting', { years: hostingYears })}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-500">🏠</span>
                                <span className="text-gray-700">{t('propertiesCount', { count: landlord.properties_count })}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-500">🌟</span>
                                <span className="text-gray-700">{t('responseRate')}</span>
                            </div>
                        </div>

                        <hr className="my-4" />

                        <div className="text-sm text-gray-500 mb-6">
                            <p>{t('contactText')}</p>
                        </div>

                        <div className="w-full">
                            <ContactButton landlordId={landlord.id} />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-8 lg:col-span-9">
                    <h2 className="text-2xl font-semibold mb-6">{t('hostListings', { name: landlord.name })}</h2>

                    {landlord.properties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {landlord.properties.map((property) => (
                                <PropertyListItem
                                    key={property.id}
                                    property={property}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl p-8 text-center">
                            <div className="text-gray-400 text-5xl mb-4">🏠</div>
                            <p className="text-gray-600">{t('noListings')}</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default LandlordDetailsPage; 