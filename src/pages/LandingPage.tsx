import { lazy, Suspense } from 'react'
import { Helmet } from 'react-helmet-async'

// 1. Lazy load the heavy 3D component
const Hero3D = lazy(() => import('../components/landing/Hero3D'))

import Testimonials from '../components/landing/Testimonials'
// import HowItWorks from '../components/landing/HowItWorks'
// import HowItWorks from '../components/landing/HowItWorks' 
import ProductShowcase from '../components/landing/ProductShowcase'
import TierPricing from '../components/landing/TierPricing'
import PlatformAccess from '../components/landing/PlatformAccess'
import Benefits from '../components/landing/Benefits'
import FAQSection, { faqs } from '../components/landing/FAQSection'
import RegistrationForm from '../components/landing/RegistrationForm'
import FloatingToast from '../components/landing/FloatingToast'
import ValueComparison from '../components/landing/ValueComparison'
import RealityCheck from '../components/landing/RealityCheck'
import SneakPeek from '../components/landing/SneakPeek'
import BonusProducts from '../components/landing/BonusProducts'
import MemberResults from '../components/landing/MemberResults'
import { TrackSection } from '../components/landing/TrackSection';

// Fallback component while 3D engine loads
const HeroFallback = () => (
  <div className="flex items-center justify-center w-full h-[90vh] bg-slate-950">
    <div className="w-8 h-8 border-4 border-t-transparent border-indigo-500 rounded-full animate-spin"></div>
  </div>
)

interface LandingPageProps {
  showBasicOnly?: boolean;
}

export default function LandingPage({ showBasicOnly }: LandingPageProps) {
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
    <div className="min-h-screen bg-slate-950">
      <Helmet>
        <title>Digital Squad - Solusi Bebas Hutang & Bisnis Online Modal Kecil</title>
        <meta name="description" content="Ubah modal 50 ribu jadi solusi lunas hutang & bebas teror pinjol bersama Digital Squad. Cara termudah hasilkan jutaan rupiah dari strategi digital marketing." />
        <meta name="keywords" content="bebas hutang, lunas pinjol, bisnis modal kecil, digital marketing, bisnis online, digital squad, affiliate marketing, cari uang online, peluang usaha, kerja sampingan" />

        {/* Canonical URL */}
        <link rel="canonical" href={showBasicOnly ? `${baseUrl}/50` : baseUrl} />

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

      <TrackSection name="Hero">
        <Suspense fallback={<HeroFallback />}>
          <Hero3D />
        </Suspense>
      </TrackSection>

      {/* New Flow: Reality Check Phase */}
      <TrackSection name="Reality Check">
        <RealityCheck />
      </TrackSection>

      {/* Social Proof */}
      <TrackSection name="Testimonials (Social Proof)">
        <Testimonials />
      </TrackSection>

      {/* Logic/Mechanism Phase */}
      <TrackSection name="Sneak Peek (Logic)">
        <SneakPeek />
      </TrackSection>

      {/* Product Showcase */}
      <TrackSection name="Product Showcase">
        <ProductShowcase />
      </TrackSection>

      {/* Rationalization Phase */}
      <TrackSection name="Value Comparison (50k Challenge)">
        <ValueComparison />
      </TrackSection>

      {/* Benefits */}
      <TrackSection name="Benefits">
        <Benefits />
      </TrackSection>

      {/* Interactive/Hook Phase - Conditional Render */}
      <TrackSection name="Platform Access (Interactive)">
        <PlatformAccess />
      </TrackSection>

      {/* FOMO Bonuses */}
      <TrackSection name="FOMO Bonuses">
        <BonusProducts />
      </TrackSection>

      {/* Member Results / Social Proof */}
      <TrackSection name="Member Results">
        <MemberResults />
      </TrackSection>

      <TrackSection name="Pricing / Plans">
        <TierPricing showOnlyTier={showBasicOnly ? 'basic' : undefined} />
      </TrackSection>

      {/* FAQ & Closing */}
      <TrackSection name="FAQ Section">
        <FAQSection />
      </TrackSection>

      <TrackSection name="Registration Form">
        <RegistrationForm showBasicOnly={showBasicOnly} />
      </TrackSection>

      <FloatingToast />
      <footer className="py-8 text-center border-t text-slate-500 bg-slate-950 border-slate-900">
        <p>&copy; {new Date().getFullYear()} Digital Squad. All rights reserved. This site is not part of the Facebook website or Facebook Inc</p>
        <p>Tempat Belajar & Platform Bisnis - Disclaimer: Bahwa hasil setiap orang berbeda-beda</p>
        <p><a href="/privacy-policy.md">Privacy Policy</a> | <a href="/terms-of-service.md">Terms of Service</a></p>
      </footer>
    </div>
  )
}

