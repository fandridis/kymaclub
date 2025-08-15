import { Button } from '~/components/ui/button';
import type { Route } from '../+types/root';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Ποιοι είμαστε | KymaClub" },
    { name: "description", content: "Ποιοι είμαστε; Είμαστε δύο code-loving, wellness-obsessed entrepreneurs (και ένας very good boy 🐕) που αποφασίσαμε να κάνουμε το wellness στην Ελλάδα πιο accessible, fun, και actually doable για όλους μας! 🚀" },
  ];
}

interface AboutProps {
  onBack: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export default function About({ onBack, currentPage, setCurrentPage }: AboutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-8 bg-gradient-to-br from-orange-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-orange-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-green-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-br from-pink-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-8xl leading-none tracking-tight text-gray-900">
              {t('aboutUs.hero.title1')}
              <span className="bg-gradient-to-r from-orange-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                {t('aboutUs.hero.title2')}
              </span>{' '}
              {t('aboutUs.hero.title3')}
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              {t('aboutUs.hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Story Text */}
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight text-gray-900">
                  {t('aboutUs.story.title')}
                </h2>
                <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                  <p>
                    {t('aboutUs.story.paragraph1')}
                  </p>
                  <p>
                    {t('aboutUs.story.paragraph2')}
                  </p>
                  <p className="text-purple-600 text-xl italic">
                    {t('aboutUs.story.quote')}
                  </p>
                  <p>
                    {t('aboutUs.story.paragraph3')}
                  </p>
                </div>
              </div>
            </div>

            {/* Team Visual */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-100 to-green-100 rounded-3xl p-12 text-center">
                <div className="text-8xl mb-8">👨‍💻👩‍💻🐕</div>
                <h3 className="text-2xl text-gray-900 mb-4">
                  {t('aboutUs.team.title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('aboutUs.team.description')}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-4">👨‍💻</div>
                  <h4 className="text-lg text-gray-900 mb-2">
                    {t('aboutUs.team.cto.title')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('aboutUs.team.cto.description')}
                  </p>
                </div>
                <div className="bg-pink-50 rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-4">👩‍💻</div>
                  <h4 className="text-lg text-gray-900 mb-2">
                    {t('aboutUs.team.ceo.title')}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('aboutUs.team.ceo.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight">
              {t('aboutUs.mission.title1')}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t('aboutUs.mission.title2')}
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              {t('aboutUs.mission.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
              <div className="text-5xl mb-6">🎯</div>
              <h3 className="text-2xl mb-4">
                {t('aboutUs.mission.accessible.title')}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t('aboutUs.mission.accessible.description')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
              <div className="text-5xl mb-6">🤝</div>
              <h3 className="text-2xl mb-4">
                {t('aboutUs.mission.community.title')}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t('aboutUs.mission.community.description')}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center">
              <div className="text-5xl mb-6">🚀</div>
              <h3 className="text-2xl mb-4">
                {t('aboutUs.mission.technology.title')}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {t('aboutUs.mission.technology.description')}
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="bg-white/5 rounded-3xl p-12 max-w-4xl mx-auto">
              <h3 className="text-3xl mb-6">
                {t('aboutUs.mission.vision.title')}
              </h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                {t('aboutUs.mission.vision.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight text-gray-900">
              {t('aboutUs.values.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('aboutUs.values.subtitle')}
            </p>
          </div>

          <div className="space-y-12">
            {/* Value 1 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-purple-100 px-6 py-3 rounded-full">
                  <div className="text-2xl">🌊</div>
                  <span className="text-purple-700">
                    {t('aboutUs.values.authenticity.badge')}
                  </span>
                </div>
                <h3 className="text-3xl text-gray-900">
                  {t('aboutUs.values.authenticity.title')}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {t('aboutUs.values.authenticity.description')}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-gray-600 italic">
                    {t('aboutUs.values.authenticity.quote')}
                  </p>
                </div>
              </div>
            </div>

            {/* Value 2 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="bg-white rounded-2xl p-8 shadow-lg lg:order-1">
                <div className="text-center">
                  <div className="text-6xl mb-4">🤗</div>
                  <p className="text-gray-600 italic">
                    {t('aboutUs.values.kindness.quote')}
                  </p>
                </div>
              </div>
              <div className="space-y-6 lg:order-2">
                <div className="inline-flex items-center gap-3 bg-green-100 px-6 py-3 rounded-full">
                  <div className="text-2xl">🌱</div>
                  <span className="text-green-700">
                    {t('aboutUs.values.kindness.badge')}
                  </span>
                </div>
                <h3 className="text-3xl text-gray-900">
                  {t('aboutUs.values.kindness.title')}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {t('aboutUs.values.kindness.description')}
                </p>
              </div>
            </div>

            {/* Value 3 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-orange-100 px-6 py-3 rounded-full">
                  <div className="text-2xl">⚡</div>
                  <span className="text-orange-700">
                    {t('aboutUs.values.innovation.badge')}
                  </span>
                </div>
                <h3 className="text-3xl text-gray-900">
                  {t('aboutUs.values.innovation.title')}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {t('aboutUs.values.innovation.description')}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-600 italic">
                    {t('aboutUs.values.innovation.quote')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-purple-600 via-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl lg:text-6xl tracking-tight">
            {t('aboutUs.cta.title')}
          </h2>
          <p className="text-xl lg:text-2xl text-white/90 leading-relaxed">
            {t('aboutUs.cta.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Button
              onClick={() => navigate('/how-it-works')}
              className="bg-white text-purple-600 hover:bg-gray-100 h-16 px-12 rounded-full text-lg transition-all duration-300 shadow-xl"
            >

              {t('aboutUs.cta.joinWaitlist')}

            </Button>
            <Button
              onClick={() => navigate('/partners')}
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 h-16 px-12 rounded-full text-lg transition-all duration-300"
            >

              {t('aboutUs.cta.becomePartner')}

            </Button>
          </div>

          <div className="pt-8 space-y-4 text-white/80">
            <p className="text-lg">
              {t('aboutUs.cta.questions')}
            </p>
            <p className="text-sm">
              {t('aboutUs.cta.contact')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}