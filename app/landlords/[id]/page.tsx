import Image from "next/image";
import ContactButton from "@/app/components/ContactButton";
import PropertyList from "@/app/components/properties/PropertyList";

const LandlordDetailsPage = () => {
    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="md:col-span-5 lg:col-span-4">
                    <div className="border border-gray-200 rounded-xl p-6 shadow-md">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
                                <Image
                                    src="/profile_pic_1.jpg"
                                    alt="Katherine"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h1 className="text-2xl font-semibold">Katherine</h1>
                            <p className="text-gray-500">Superhost</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-center space-x-2">
                                <span>⭐</span>
                                <span className="font-semibold">4.89</span>
                                <span className="text-gray-500">(334 reviews)</span>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                                <span>📅</span>
                                <span>11 years hosting</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="space-y-4 max-w-[200px] mx-auto">
                                <div className="flex items-center space-x-3">
                                    <span>🗣️</span>
                                    <span>Speaks English</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span>📍</span>
                                    <span>Lives in Malibu, CA</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 mt-6 pt-6">
                            <h2 className="font-semibold text-center mb-4">Katherine's verified infomation</h2>
                            <div className="space-y-2 max-w-[200px] mx-auto">
                                <div className="flex items-center space-x-2">
                                    <span>✓</span>
                                    <span>Identity</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✓</span>
                                    <span>Email address</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span>✓</span>
                                    <span>Phone number</span>
                                </div>
                            </div>
                        </div>

                        <ContactButton />
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-7 lg:col-span-8">
                    <h2 className="text-2xl font-semibold mb-6">Katherine's reviews</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <ReviewCard
                            text="Katherine's home was beautiful! Perfectly located in Malibu near some of the best restaurants and attractions in the city."
                            author="Riana"
                            date="December 2024"
                            image="/profile_pic_1.jpg"
                        />
                        <ReviewCard
                            text="Beautiful lovely stay!"
                            author="Brittany & Ryan"
                            date="December 2024"
                            image="/profile_pic_1.jpg"
                        />
                    </div>

                    <h2 className="text-2xl font-semibold mb-6">Katherine's listings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <PropertyList />
                    </div>
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