import { useTranslation } from 'react-i18next';
import { WaitingListSection } from "~/components/elements/waitingListSection";
import type { Route } from "./+types/howItWorks";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Μία συνδρομή, εκατοντάδες εμπειρίες σε όλη την Ελλάδα | KymaClub" },
    { name: "description", content: "Κλείστε την επόμενη εμπειρία σας με το KymaClub. Μία συνδρομή, εκατοντάδες εμπειρίες σε όλη την Ελλάδα." },
  ];
}

export default function HowItWorks() {
  const { t } = useTranslation();

  // Color mapping for badge classes - ensures Tailwind detects all classes at build time
  const badgeColorClasses = {
    purple: {
      bg: 'bg-purple-100',
      dot: 'bg-purple-500',
      text: 'text-purple-700'
    },
    orange: {
      bg: 'bg-orange-100',
      dot: 'bg-orange-500',
      text: 'text-orange-700'
    },
    emerald: {
      bg: 'bg-emerald-100',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700'
    }
  };

  const features = [
    {
      id: 1,
      badge: { color: 'purple', text: t('howItWorks.features.subscription.badge') },
      title: t('howItWorks.features.subscription.title'),
      description: [
        t('howItWorks.features.subscription.description1'),
        t('howItWorks.features.subscription.description2')
      ],
      cardTitle: 'Απεριόριστη Ευελιξία',
      cardSubtitle: 'Credits που κυλάνε στον επόμενο μήνα',
      cardStat: '50+',
      cardStatLabel: 'Credits/μήνα',
      gradient: 'from-purple-500 to-blue-500',
      img: 'ChatGPTaddcoins'
      // img: 'Geminiaddcoins'
    },
    {
      id: 2,
      badge: { color: 'orange', text: t('howItWorks.features.discovery.badge') },
      title: t('howItWorks.features.discovery.title'),
      description: [
        t('howItWorks.features.discovery.description1'),
        t('howItWorks.features.discovery.description2')
      ],
      cardTitle: 'Smart Discovery',
      cardSubtitle: 'AI-powered προτάσεις based στις προτιμήσεις σου',
      cardStat: '500+',
      cardStatLabel: 'Partner locations',
      gradient: 'from-green-500 to-teal-500',
      // img: 'ChatGPTpickactivity'
      img: 'Geminipickactivity2'
    },
    {
      id: 3,
      badge: { color: 'emerald', text: t('howItWorks.features.experience.badge') },
      title: t('howItWorks.features.experience.title'),
      description: [
        t('howItWorks.features.experience.description1'),
        t('howItWorks.features.experience.description2')
      ],
      cardTitle: 'QR Magic',
      cardSubtitle: 'Instant access σε όλα τα partner locations',
      cardStat: '<2s',
      cardStatLabel: 'Check-in time',
      gradient: 'from-orange-500 to-pink-500',
      // img: 'ChatGPTpickactivity'
      img: 'Geminiattending'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section - Full Width */}
      <section className="pt-40 pb-16 px-8 bg-white">
        <div className="w-full text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-8xl leading-none tracking-tight text-gray-900">
          {t('howItWorks.hero.title')}<br/><span>
          {t('howItWorks.hero.titleColored')}
          </span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 max-w-xl mx-auto leading-relaxed">
         
          {t('howItWorks.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gray-50 text-black py-20">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-16">
            <h2 className="mx-auto text-5xl mb-4 tracking-tight leading-tight">
              {t('howItWorks.section.title')}
            </h2>
          </div>

          {/* Cards Container */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 group" key={feature.id}>
                    <div className="mb-6">
                      <img 
                        src={`/${feature.img}.png`} 
                        alt={feature.title}
                        className="w-full h-96 object-cover rounded-xl"
                      />
                    </div>
                    <div className="mb-6">
                    <h3 className="text-3xl mb-6 tracking-tight"> {feature.badge.text}</h3>
                      <div className={`mb-4 inline-flex items-center gap-3 ${badgeColorClasses[feature.badge.color as keyof typeof badgeColorClasses].bg} px-6 py-3 rounded-full`}>
                        <div className={`w-3 h-3 ${badgeColorClasses[feature.badge.color as keyof typeof badgeColorClasses].dot} rounded-full`}></div>
                        <span className={`text-sm ${badgeColorClasses[feature.badge.color as keyof typeof badgeColorClasses].text} tracking-wide`}>
                         {feature.title}
                        </span>
                      </div>
                     
                      <p className="pb-5 text-gray-600 text-sm leading-relaxed">
                      {feature.description[0]}
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description[1]}
                      </p>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaitingListSection />
    </div>
  );
}