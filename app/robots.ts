import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/how-primefx-works',
          '/contact',
          '/legal',
          '/terms',
          '/privacy',
          '/risk-disclosure',
          '/cookies',
          '/aml-policy',
          '/kyc-policy',
          '/signup',
        ],
        disallow: [
          '/admin',
          '/dashboard',
          '/wallet',
          '/portfolio',
          '/invest',
          '/transactions',
          '/profile',
          '/settings',
          '/notifications',
          '/primeai',
          '/api/',
          '/auth/',
          '/login',
          '/2fa-verify',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
