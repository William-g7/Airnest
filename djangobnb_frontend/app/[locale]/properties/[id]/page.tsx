import PropertyDetail from '@/app/components/properties/PropertyDetail';
import apiService from '@/app/services/apiService';
import type { ImageType } from '@/app/constants/image';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: {
    id: string;
    locale: string;
  };
};

const PropertyDetailPage = async (props: Props) => {
  const params = await props.params;
  const id = params.id;
  const property = await apiService.get(`/api/properties/${id}`);
  const t = await getTranslations('property');

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-6">
      <PropertyDetail property={property} />
    </main>
  );
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const id = params.id;

  const [property, t] = await Promise.all([
    apiService.get(`/api/properties/${id}`),
    getTranslations('property'),
  ]);

  const metadata: Metadata = {
    title: `${property.title} - DjangoBnB`,
    description: property.description.substring(0, 160),
    openGraph: {
      title: property.title,
      description: property.description,
      images: property.images.map((img: ImageType) => ({
        url: img.imageURL,
        width: 1200,
        height: 630,
        alt: property.title,
      })),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: property.title,
      description: property.description,
      images: [property.images[0]?.imageURL],
    },
    alternates: {
      canonical: `/properties/${id}`,
      languages: {
        en: `/en/properties/${id}`,
        zh: `/zh/properties/${id}`,
        fr: `/fr/properties/${id}`,
      },
    },
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.title,
    description: property.description,
    image: property.images.map((img: ImageType) => img.imageURL),
    priceRange: `$${property.price_per_night} ${t('perNight')}`,
    owner: {
      '@type': 'Person',
      name: property.landlord.name,
      image: property.landlord.avatar_url,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      addressCountry: property.country,
    },
    amenityFeature: [
      {
        '@type': 'LocationFeatureSpecification',
        name: t('bedrooms'),
        value: property.bedrooms,
      },
      {
        '@type': 'LocationFeatureSpecification',
        name: t('bathrooms'),
        value: property.bathrooms,
      },
      {
        '@type': 'LocationFeatureSpecification',
        name: t('guests'),
        value: property.guests,
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: property.rating,
      reviewCount: property.reviews_count,
    },
    availability: 'https://schema.org/InStock',
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `https://djangobnb.com/properties/${id}`,
        actionPlatform: ['http://schema.org/DesktopWebPlatform'],
      },
    },
  };

  return {
    ...metadata,
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
}

export default PropertyDetailPage;
