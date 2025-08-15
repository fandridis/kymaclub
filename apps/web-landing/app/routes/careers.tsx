import { useState } from 'react';
import { Button } from '~/components/ui/button';
import type { Route } from '../+types/root';
import { useTranslation } from 'react-i18next';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Καριέρα | KymaClub" },
    { name: "description", content: "Ψάχνεις για κάτι παραπάνω από απλά μια δουλειά; Θέλεις να φτιάξεις το μέλλον του wellness στην Ελλάδα; Ελα να γνωριστούμε - we're looking for amazing humans! 🚀" },
  ];
}


interface CareersProps {
  onBack: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function Careers({ onBack, currentPage, setCurrentPage }: CareersProps) {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const { t } = useTranslation();

  const openPositions = [
    {
      id: 'product-manager',
      title: t('careers.jobs.productManager.title'),
      department: t('careers.jobs.productManager.department'),
      location: t('careers.jobs.productManager.location'),
      type: t('careers.jobs.productManager.type'),
      description: t('careers.jobs.productManager.description'),
      requirements: t('careers.jobs.productManager.requirements', { returnObjects: true }) as string[],
      perks: [t('careers.perks.competitiveSalary'), t('careers.culture.perks.remote.title'), t('careers.culture.perks.flexible.title'), t('careers.culture.perks.membership.title'), t('careers.culture.perks.learning.title'), t('careers.culture.perks.coffee.title')]
    },
    {
      id: 'growth-manager',
      title: t('careers.jobs.growthManager.title'),
      department: t('careers.jobs.growthManager.department'),
      location: t('careers.jobs.growthManager.location'),
      type: t('careers.jobs.growthManager.type'),
      description: t('careers.jobs.growthManager.description'),
      requirements: t('careers.jobs.growthManager.requirements', { returnObjects: true }) as string[],
      perks: [t('careers.perks.competitiveSalary'), t('careers.culture.perks.remote.title'), t('careers.culture.perks.flexible.title'), t('careers.culture.perks.membership.title'), t('careers.culture.perks.learning.title'), t('careers.culture.perks.coffee.title')]
    },
    {
      id: 'marketing-specialist',
      title: t('careers.jobs.marketingSpecialist.title'),
      department: t('careers.jobs.marketingSpecialist.department'),
      location: t('careers.jobs.marketingSpecialist.location'),
      type: t('careers.jobs.marketingSpecialist.type'),
      description: t('careers.jobs.marketingSpecialist.description'),
      requirements: t('careers.jobs.marketingSpecialist.requirements', { returnObjects: true }) as string[],
      perks: [t('careers.perks.competitiveSalary'), t('careers.culture.perks.remote.title'), t('careers.culture.perks.flexible.title'), t('careers.culture.perks.membership.title'), t('careers.culture.perks.learning.title'), t('careers.culture.perks.coffee.title')]
    },
    {
      id: 'community-manager',
      title: t('careers.jobs.communityManager.title'),
      department: t('careers.jobs.communityManager.department'),
      location: t('careers.jobs.communityManager.location'),
      type: t('careers.jobs.communityManager.type'),
      description: t('careers.jobs.communityManager.description'),
      requirements: t('careers.jobs.communityManager.requirements', { returnObjects: true }) as string[],
      perks: [t('careers.perks.competitiveSalary'), t('careers.culture.perks.remote.title'), t('careers.culture.perks.flexible.title'), t('careers.culture.perks.membership.title'), t('careers.culture.perks.learning.title'), t('careers.culture.perks.coffee.title')]
    },
    {
      id: 'software-engineer-intern',
      title: t('careers.jobs.softwareEngineerIntern.title'),
      department: t('careers.jobs.softwareEngineerIntern.department'),
      location: t('careers.jobs.softwareEngineerIntern.location'),
      type: t('careers.jobs.softwareEngineerIntern.type'),
      description: t('careers.jobs.softwareEngineerIntern.description'),
      requirements: t('careers.jobs.softwareEngineerIntern.requirements', { returnObjects: true }) as string[],
      perks: [t('careers.perks.competitiveSalary'), t('careers.culture.perks.remote.title'), t('careers.culture.perks.flexible.title'), t('careers.culture.perks.membership.title'), t('careers.culture.perks.learning.title'), t('careers.culture.perks.coffee.title')]
    }
  ];

  const companyValues = [
    {
      icon: '🌊',
      title: t('careers.values.waveEnergy.title'),
      description: t('careers.values.waveEnergy.description')
    },
    {
      icon: '🤝',
      title: t('careers.values.authenticConnections.title'),
      description: t('careers.values.authenticConnections.description')
    },
    {
      icon: '🚀',
      title: t('careers.values.growthMindset.title'),
      description: t('careers.values.growthMindset.description')
    },
    {
      icon: '💜',
      title: t('careers.values.wellnessFirst.title'),
      description: t('careers.values.wellnessFirst.description')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section */}
      <section className="pt-28 pb-16 px-8 bg-gradient-to-br from-green-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-green-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-8xl leading-none tracking-tight text-gray-900">
              {t('careers.hero.title1')}{' '}
              <span className="bg-gradient-to-r from-green-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t('careers.hero.title2')}
              </span>{' '}
              {t('careers.hero.title3')}
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              {t('careers.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Button
                onClick={() => {
                  const element = document.getElementById('positions');
                  if (element) {
                    const elementPosition = element.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top: elementPosition, behavior: 'smooth' });
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-purple-600 hover:from-green-700 hover:to-purple-700 text-white h-16 px-12 rounded-full text-lg transition-all duration-300 shadow-xl"
              >
                {t('careers.hero.cta')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Company Culture Section */}
      <section id="culture" className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight text-gray-900">
              {t('careers.culture.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('careers.culture.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {companyValues.map((value) => (
              <div key={value.title} className="text-center space-y-4">
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>

          {/* Perks & Benefits */}
          <div className="bg-gradient-to-br from-purple-50 to-green-50 rounded-3xl p-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl mb-4 text-gray-900">{t('careers.culture.perks.title')}</h3>
              <p className="text-gray-600 text-lg">{t('careers.culture.perks.subtitle')}</p>
            </div>

            <div className="flex flex-wrap gap-12 justify-center">
              <div className="w-1/4 text-center space-y-3">
                <div className="text-3xl">🏠</div>
                <h4 className="text-lg text-gray-900">{t('careers.culture.perks.remote.title')}</h4>
                <p className="text-sm text-gray-600">{t('careers.culture.perks.remote.description')}</p>
              </div>
              <div className="w-1/4 text-center space-y-3">
                <div className="text-3xl">⏰</div>
                <h4 className="text-lg text-gray-900">{t('careers.culture.perks.flexible.title')}</h4>
                <p className="text-sm text-gray-600">{t('careers.culture.perks.flexible.description')}</p>
              </div>
              <div className="w-1/4 text-center space-y-3">
                <div className="text-3xl">🧘‍♀️</div>
                <h4 className="text-lg text-gray-900">{t('careers.culture.perks.membership.title')}</h4>
                <p className="text-sm text-gray-600">{t('careers.culture.perks.membership.description')}</p>
              </div>
              <div className="w-1/4 text-center space-y-3">
                <div className="text-3xl">📚</div>
                <h4 className="text-lg text-gray-900">{t('careers.culture.perks.learning.title')}</h4>
                <p className="text-sm text-gray-600">{t('careers.culture.perks.learning.description')}</p>
              </div>
              <div className="w-1/4 text-center space-y-3">
                <div className="text-3xl">☕️</div>
                <h4 className="text-lg text-gray-900">{t('careers.culture.perks.coffee.title')}</h4>
                <p className="text-sm text-gray-600">{t('careers.culture.perks.coffee.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section id="positions" className="py-20 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight text-gray-900">
              {t('careers.positions.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('careers.positions.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position) => (
              <div
                key={position.id}
                className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedPosition(selectedPosition === position.id ? null : position.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl text-gray-900 mb-2">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{position.department}</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">{position.location}</span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{position.type}</span>
                    </div>
                  </div>
                  <div className="text-2xl text-gray-400 transform transition-transform duration-200">
                    {selectedPosition === position.id ? '−' : '+'}
                  </div>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">{position.description}</p>

                {selectedPosition === position.id && (
                  <div className="border-t border-gray-200 pt-6 mt-6 space-y-6">
                    <div>
                      <h4 className="text-lg text-gray-900 mb-3">{t('careers.sections.requirements')}</h4>
                      <ul className="space-y-2">
                        {position.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-3 text-gray-700">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg text-gray-900 mb-3">{t('careers.sections.perks')}</h4>
                      <div className="flex flex-wrap gap-2">
                        {position.perks.map((perk, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {perk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* 
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Δε βρίσκεις κάτι που να ταιριάζει; Μην ανησυχείς - στείλε μας το CV σου ούτως ή άλλως!
            </p>
            <Button 
              variant="outline"
              onClick={() => {
                setApplicationData(prev => ({ ...prev, position: 'Open Application' }));
                document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-3 rounded-full"
            >
              Ανοιχτή Αίτηση 💜
            </Button>
          </div> */}
        </div>
      </section>

      {/* Application Form Section */}
      <section id="apply" className="py-20 px-8 bg-white">
        <div className="max-w-4xl mx-auto">

          <div className="bg-gradient-to-br from-purple-50 to-green-50 rounded-3xl p-12 border border-gray-200">
            <div className="flex flex-col items-center justify-center">
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight text-gray-900">
                  {t('careers.apply.title')}
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {t('careers.apply.subtitle')}
                </p>
              </div>
              <Button
                onClick={() => window.open('https://www.linkedin.com/company/kymaclub', '_blank')}
                className="bg-[#0A66C2] hover:bg-[#004182] text-white px-8 py-6 rounded-2xl transition-all duration-300 flex items-center gap-3 text-lg"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                {t('careers.apply.linkedinButton')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}