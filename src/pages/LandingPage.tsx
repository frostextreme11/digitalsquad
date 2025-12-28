import Hero3D from '../components/landing/Hero3D'
import Testimonials from '../components/landing/Testimonials'
import HowItWorks from '../components/landing/HowItWorks'
import ProductShowcase from '../components/landing/ProductShowcase'
import TierPricing from '../components/landing/TierPricing'
import IncomeCalculator from '../components/landing/IncomeCalculator'
import Benefits from '../components/landing/Benefits'
import FAQSection from '../components/landing/FAQSection'
import RegistrationForm from '../components/landing/RegistrationForm'
import FloatingToast from '../components/landing/FloatingToast'

export default function LandingPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <Hero3D />
      <Testimonials />
      <HowItWorks />
      <ProductShowcase />
      <TierPricing />
      <IncomeCalculator />
      <Benefits />
      <FAQSection />
      <RegistrationForm />
      <FloatingToast />
      <footer className="py-8 text-center text-slate-500 bg-slate-950 border-t border-slate-900">
        <p>&copy; 2025 Digital Squad. All rights reserved.</p>
      </footer>
    </div>
  )
}
