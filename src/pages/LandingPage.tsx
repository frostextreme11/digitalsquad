import { lazy, Suspense } from 'react'
import { Helmet } from 'react-helmet-async'

// 1. Lazy load the heavy 3D component
const Hero3D = lazy(() => import('../components/landing/Hero3D'))

import Testimonials from '../components/landing/Testimonials'
import HowItWorks from '../components/landing/HowItWorks'
import ProductShowcase from '../components/landing/ProductShowcase'
import TierPricing from '../components/landing/TierPricing'
import IncomeCalculator from '../components/landing/IncomeCalculator'
import Benefits from '../components/landing/Benefits'
import FAQSection, { faqs } from '../components/landing/FAQSection'
import RegistrationForm from '../components/landing/RegistrationForm'
import FloatingToast from '../components/landing/FloatingToast'
import ValueComparison from '../components/landing/ValueComparison'

// Fallback component while 3D engine loads
const HeroFallback = () => (
  <div className="h-[90vh] w-full bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

export default function LandingPage() {
  const baseUrl = 'https://digitalsquad.id'
  const imageUrl = `${baseUrl}/android-chrome-512x512.png`

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        'name': 'Digital Squad',
        'url': baseUrl,
        'logo': {
          '@type': 'ImageObject',
          'url': imageUrl,
          'width': 512,
          'height': 512
        }
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        'url': baseUrl,
        'name': 'Digital Squad',
        'description': 'Platform Belajar Digital Marketing & Bisnis Online Terbaik',
        'publisher': {
          '@id': `${baseUrl}/#organization`
        }
      },
      {
        '@type': 'Product',
        'name': 'Digital Squad Premium Membership',
        'description': 'Akses seumur hidup ke materi digital marketing, produk PLR, dan sistem affiliate dengan modal sekali bayar.',
        'image': imageUrl,
        'brand': {
          '@id': `${baseUrl}/#organization`
        },
        'offers': {
          '@type': 'Offer',
          'price': '50000',
          'priceCurrency': 'IDR',
          'availability': 'https://schema.org/InStock',
          'url': baseUrl,
          'priceValidUntil': new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.9',
          'reviewCount': '2450',
          'bestRating': '5',
          'worstRating': '1'
        }
      },
      {
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer
          }
        }))
      }
    ]
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      <Helmet>
        <title>Digital Squad - Solusi Bebas Hutang & Bisnis Online Modal Kecil</title>
        <meta name="description" content="Ubah modal 50 ribu jadi solusi lunas hutang & bebas teror pinjol bersama Digital Squad. Cara termudah hasilkan jutaan rupiah dari strategi digital marketing." />
        <meta name="keywords" content="bebas hutang, lunas pinjol, bisnis modal kecil, digital marketing, bisnis online, digital squad, affiliate marketing, cari uang online, peluang usaha, kerja sampingan" />

        {/* Canonical URL */}
        <link rel="canonical" href={baseUrl} />

        {/* Open Graph */}
        <meta property="og:title" content="Digital Squad - Solusi Bebas Hutang & Bisnis Online Modal Kecil" />
        <meta property="og:description" content="Ubah modal 50 ribu jadi solusi lunas hutang & bebas teror pinjol bersama Digital Squad. Cara termudah hasilkan jutaan rupiah dari strategi digital marketing." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={baseUrl} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:site_name" content="Digital Squad" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Squad - Solusi Bebas Hutang & Bisnis Online Modal Kecil" />
        <meta name="twitter:description" content="Ubah modal 50 ribu jadi solusi lunas hutang & bebas teror pinjol bersama Digital Squad. Cara termudah hasilkan jutaan rupiah dari strategi digital marketing." />
        <meta name="twitter:image" content={imageUrl} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      <Suspense fallback={<HeroFallback />}>
        <Hero3D />
      </Suspense>
      <Testimonials />
      <HowItWorks />
      <ValueComparison />
      <ProductShowcase />
      <IncomeCalculator />
      <Benefits />
      <FAQSection />
      <TierPricing />
      <RegistrationForm />
      <FloatingToast />
      <footer className="py-8 text-center text-slate-500 bg-slate-950 border-t border-slate-900">
        <p>&copy; {new Date().getFullYear()} Digital Squad. All rights reserved.</p>
      </footer>
    </div>
  )
}
