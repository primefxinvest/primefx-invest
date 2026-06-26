'use client'

import HeroSection from '@/components/landing/HeroSection'
import WhyChooseSection from '@/components/landing/sections/WhyChooseSection'
import JourneySection from '@/components/landing/sections/JourneySection'
import InvestmentPlansSection from '@/components/landing/sections/InvestmentPlansSection'
import PerformanceSection from '@/components/landing/sections/PerformanceSection'
import SecuritySection from '@/components/landing/sections/SecuritySection'
import TestimonialsSection from '@/components/landing/sections/TestimonialsSection'
import GlobalImpactSection from '@/components/landing/sections/GlobalImpactSection'
import FAQSection from '@/components/landing/sections/FAQSection'
import AppCTASection from '@/components/landing/sections/AppCTASection'
import LandingFooter from '@/components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="light min-h-screen bg-white text-gray-900">
      <HeroSection />
      <WhyChooseSection />
      <JourneySection />
      <InvestmentPlansSection />
      <PerformanceSection />
      <SecuritySection />
      <TestimonialsSection />
      <GlobalImpactSection />
      <FAQSection />
      <AppCTASection />
      <LandingFooter />
    </div>
  )
}
