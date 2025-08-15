import type { Route } from "./+types/home";
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { WaitingListSection } from "~/components/elements/waitingListSection";
import { useNavigate } from 'react-router';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Πώς λειτουργεί η συνδρομή | KymaClub" },
    { name: "description", content: "Μία συνδρομή, εκατοντάδες εμπειρίες σε όλη την Ελλάδα." },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handlePartnerClick = () => {
    navigate('/partners');
  };

  const handleJoinWaitlist = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Full Screen Video Header */}
      <div className="relative h-screen overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source
              src="https://gefakit.com/hero-video.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center h-full px-6">
          <div className="text-center space-y-12 max-w-4xl">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl leading-none text-white tracking-tight">
              {t('home.title')}<br />
              <span className="text-white/40">{t('home.subtitle')}</span>
            </h1>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12">
              <Button
                onClick={handleJoinWaitlist}
                className="bg-white text-black hover:bg-gray-100 h-16 px-12 rounded-full text-lg transition-all duration-300"
              >
                {t('home.joinWaitlist')}
              </Button>
              <Button
                onClick={handlePartnerClick}
                variant="outline"
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-black h-16 px-12 rounded-full text-lg transition-all duration-300"
              >
                {t('home.partnerWithUs')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <WaitingListSection />
    </div>
  );
}