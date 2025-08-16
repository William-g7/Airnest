import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://airnest.me'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/_next/', '/inbox/', '/myprofile/', '/myproperties/', '/myreservations/', '/mywishlists/'],
      crawlDelay: 1,
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}