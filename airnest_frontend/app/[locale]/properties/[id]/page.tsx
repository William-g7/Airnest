import { notFound } from 'next/navigation';
import PropertyContainer from '@properties/detail/Detail.Container';
import { getPropertyByIdWithReviews } from '@properties/server/queries';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{
    id: string;
    locale: string;
  }>;
};

const PropertyDetailPage = async (props: Props) => {
  const params = await props.params;
  const id = params.id;
  const property = await getPropertyByIdWithReviews(id);
  if (!property) notFound();

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-6">
      <PropertyContainer property={property} />
    </main>
  );
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [property, t] = await Promise.all([
    getPropertyByIdWithReviews(id),
    getTranslations('property'),
  ]);

  if (!property) {
    return { title: 'Airnest', description: '' };
  }

  const metadata: Metadata = {
    title: `${property.title} - Airnest`,
    description: property.description ? property.description.slice(0, 160) : '',
    openGraph: {
      title: property.title,
      description: property.description || '',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: property.title,
      description: property.description || '',
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
  return metadata;
}

export default PropertyDetailPage;
