import Image from "next/image";
import Link from "next/link";
import PropertyList from "@/app/components/properties/PropertyList";

const MyPropertiesPage = () => {
    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <h1 className="text-3xl font-semibold my-8">My properties</h1>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <PropertyList />
            </div>
        </main>
    );
};

export default MyPropertiesPage;