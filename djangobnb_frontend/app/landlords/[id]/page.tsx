import Image from "next/image";
import ContactButton from "@/app/components/ContactButton";
import PropertyList from "@/app/components/properties/PropertyList";
import apiService from "@/app/services/apiService";
const LandlordDetailsPage = async ({ params }: { params: { id: string } }) => {
    const landlord = await apiService.get(`/api/auth/landlords/${params.id}/`);

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
                                <span>⭐</span>
                                <span className="font-semibold">{landlord.average_rating}</span>
                                <span className="text-gray-500">({landlord.total_reviews} reviews)</span>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                                <span>📅</span>
                                <span>{new Date().getFullYear() - new Date(landlord.date_joined).getFullYear()} years hosting</span>
                            </div>
                        </div>

                        {/* <ContactButton landlordId={params.id} /> */}
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-7 lg:col-span-8">
                    <h2 className="text-2xl font-semibold mb-6">{landlord.name}'s listings</h2>
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {landlord.properties.map((property: any) => (
                            <PropertyListItem key={property.id} property={property} />
                        ))}
                    </div> */}
                </div>
            </div>
        </main>
    );
};


const ReviewCard = ({ text, author, date, image }: { text: string, author: string, date: string, image: string }) => {
    return (
        <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-4">
                <Image
                    src={image}
                    alt={author}
                    width={40}
                    height={40}
                    className="rounded-full"
                />
                <div>
                    <p className="font-semibold">{author}</p>
                    <p className="text-sm text-gray-500">{date}</p>
                </div>
            </div>
            <p className="text-gray-600">{text}</p>
        </div>
    );
};

export default LandlordDetailsPage;