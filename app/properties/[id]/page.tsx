import Image from "next/image";
import ReservationSideBar from "@/app/components/properties/ReservationSideBar";

const PropertyDetailPage = () => {
    return (
        <main className="max-w-[1500px]mx-auto px-6 pb-6">
            <div>
                <div className="relative mb-4 w-full h-[64vh] rounded-xl overflow-hidden">
                    <Image
                        src="/beach_1.jpg"
                        alt="Beach House"
                        fill
                        className="object-cover w-full h-full"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 lg:col-span-8">
                        <h1 className="mb-4 text-4xl font-semibold">Property Title</h1>

                        <span className="mb-6 block text-2xl text-gray-600">
                            4 guests · 2 bedrooms · 2 beds · 2 baths
                        </span>

                        <hr />

                        <div className="py-6 flex items-center space-x-4">
                            <Image
                                src="/profile_pic_1.jpg"
                                alt="Host"
                                width={50}
                                height={50}
                                className="rounded-full"
                            />

                            <div className="flex flex-col">
                                <span className="text-lg font-semibold">John Doe</span>
                                <span className="text-sm text-gray-500">Host</span>
                            </div>
                        </div>

                        <hr />

                        <div className="py-6">
                            <h2 className="mb-4 text-2xl font-semibold">About this place</h2>
                            <p className="text-gray-600">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-5 lg:col-span-4">
                        <ReservationSideBar />
                    </div>
                </div>
            </div>
        </main>
    )
};

export default PropertyDetailPage;