import PropertyDetail from '@/app/components/properties/PropertyDetail';
import apiService from "@/app/services/apiService";
import type { ImageType } from '@/app/constants/image';
import type { Metadata } from 'next'

const PropertyDetailPage = async ({ params }: { params: { id: string } }) => {
    const property = await apiService.get(`/api/properties/${params.id}`);

    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <PropertyDetail property={property} />
        </main>
    );
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const property = await apiService.get(`/api/properties/${params.id}`);

    return {
        title: `${property.title} - DjangoBnb`,
        description: property.description.substring(0, 160),
        openGraph: {
            title: property.title,
            description: property.description,
            images: property.images.map((img: ImageType) => ({
                url: img.imageURL,
                width: 1200,
                height: 630,
                alt: property.title
            })),
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: property.title,
            description: property.description,
            images: [property.images[0]?.imageURL],
        },

        other: {
            'application/ld+json': JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'LodgingBusiness',
                name: property.title,
                description: property.description,
                image: property.images.map((img: ImageType) => { img.imageURL }),
                priceRange: `$${property.price_per_night} per night`,
                owner: {
                    '@type': 'Person',
                    name: property.landlord.name,
                    image: property.landlord.avatar_url
                },
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: property.city,
                    addressCountry: property.country
                },
                amenityFeature: [
                    {
                        '@type': 'LocationFeatureSpecification',
                        name: 'Bedrooms',
                        value: property.bedrooms
                    },
                    {
                        '@type': 'LocationFeatureSpecification',
                        name: 'Bathrooms',
                        value: property.bathrooms
                    },
                    {
                        '@type': 'LocationFeatureSpecification',
                        name: 'Maximum Occupancy',
                        value: property.guests
                    }
                ],
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: property.rating,
                    reviewCount: property.reviews_count
                },
                availability: 'https://schema.org/InStock',
                potentialAction: {
                    '@type': 'ReserveAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: `https://djangobnb.com/properties/${property.id}`,
                        actionPlatform: ['http://schema.org/DesktopWebPlatform']
                    }
                },
                '@type': 'Organization',
                url: 'https://djangobnb.com',
                logo: 'https://djangobnb.com/logo.png',
                sameAs: [
                    'https://twitter.com/djangobnb',
                    'https://facebook.com/djangobnb'
                ],
                breadcrumb: {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        {
                            '@type': 'ListItem',
                            position: 1,
                            item: {
                                '@id': 'https://djangobnb.com',
                                name: 'Home'
                            }
                        },
                        {
                            '@type': 'ListItem',
                            position: 2,
                            item: {
                                '@id': `https://djangobnb.com/properties`,
                                name: 'Properties'
                            }
                        }
                    ]
                }
            })
        },
        alternates: {
            canonical: `/properties/${params.id}`,
            languages: {
                'en-US': `/en-US/properties/${params.id}`,
                'zh-CN': `/zh-CN/properties/${params.id}`,
            }
        }
    }
}

export default PropertyDetailPage;