import { getFavoritesSSR } from '@favorites/server/queries';
import ListHybrid from '@properties/list/List.Hybrid';
import {getLocale, getTranslations} from 'next-intl/server';
import { getServerTranslations } from '@translation/server/serverTranslationService';

export default async function MyWishlistsPage() {
  const t = await getTranslations('mywishlists');
  const locale = await getLocale();
  const properties = await getFavoritesSSR();
  const translationsData = await getServerTranslations(properties, locale);
  const initialUserWishlist = properties.map(p => p.id);

  return (
    <main className="max-w-[1500px] mx-auto px-6 pb-6">
      <h1 className="text-3xl font-semibold my-8">{t('title')}</h1>
      {properties.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-semibold">{t('noSavedProperties')}</h3>
          <p className="text-gray-500 mt-2">{t('propertiesWillAppearHere')}</p>
        </div>
      ) : (
        <ListHybrid 
          initialProperties={properties}
          translationsData={translationsData}
          locale={locale}
          isWishlist
          initialUserWishlist={initialUserWishlist}/>
      )}
    </main>
  );
}
