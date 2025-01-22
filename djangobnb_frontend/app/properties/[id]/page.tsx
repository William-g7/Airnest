import PropertyDetail from '@/app/components/properties/PropertyDetail';
import apiService from "@/app/services/apiService";

const PropertyDetailPage = async ({ params }: { params: { id: string } }) => {
    const property = await apiService.get(`/api/properties/${params.id}`);

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <PropertyDetail property={property} />
        </main>
    );
};

export default PropertyDetailPage;