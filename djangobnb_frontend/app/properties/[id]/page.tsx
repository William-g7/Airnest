import Image from "next/image";
import ReservationSideBar from "@/app/components/properties/ReservationSideBar";
import PropertyImageCarousel from "@/app/components/properties/PropertyImageCarousel";
import apiService from "@/app/services/apiService";

const PropertyDetailPage = async ({ params }: { params: { id: string } }) => {

    const property = await apiService.get(`/api/properties/${params.id}`);

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <div>
                <PropertyImageCarousel
                    images={property.images}
                    title={property.title}
                />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 lg:col-span-8">
                        <h1 className="mb-4 text-4xl font-semibold">{property.title}</h1>

                        <span className="mb-6 block text-2xl text-gray-600">
                            {property.guests} guests · {property.bedrooms} bedrooms · {property.beds} beds · {property.bathrooms} baths
                        </span>

                        <hr />

                        {property.landlord.avatar_url ? (
                            <div className="py-6 flex items-center space-x-4">
                                <Image
                                    src={property.landlord.avatar_url || '/placeholder.jpg'}
                                    alt="Host"
                                    width={50}
                                    height={50}
                                    className="rounded-full"
                                />
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold">{property.landlord.name}</span>
                                    <span className="text-sm text-gray-500">Host</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 flex items-center space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-lg font-semibold">{property.landlord.username}</span>
                                    <span className="text-sm text-gray-500">Host</span>
                                </div>
                            </div>
                        )}

                        <hr />

                        <div className="py-6">
                            <h2 className="mb-4 text-2xl font-semibold">About this place</h2>
                            <p className="text-gray-600">
                                {property.description}
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-5 lg:col-span-4">
                        <ReservationSideBar property={property} />
                    </div>
                </div>
            </div>
        </main>
    )
};

export default PropertyDetailPage;