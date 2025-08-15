import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

type SocialHandle = {
    url: string;
    handle: string;
    imgSrc: string;
    platform: string;
    gradients: string;
}

export function FollowUsSection() {
    const { t } = useTranslation();
    const socials: SocialHandle[] = [
        {   url: 'https://www.instagram.com/kymaclub?igsh=ZGZ1NmV6bHpuZTh3&utm_source=qr', 
            handle: '@kymaclub', 
            imgSrc: '/instagram.svg',
            platform: 'Instagram',
            gradients: 'bg-gradient-to-br from-purple-500 to-pink-500'
        },
      { url: 'https://www.tiktok.com/@kyma.club?_t=ZN-8yaqmCsgtdu&_r=1', 
        handle: '@kymaclub', 
        imgSrc: '/tiktok.svg',
        platform: 'TikTok',
        gradients: 'bg-gradient-to-br from-black to-red-600'
    },
    { url: 'https://www.linkedin.com/company/kymaclub', 
        handle: 'KymaClub', 
        imgSrc: '/linkedin.svg',
        platform: 'LinkedIn',
        gradients: 'bg-gradient-to-br from-blue-600 to-blue-800'
    }
     ];

  const handleSocialClick = (social: SocialHandle) => {
    if (social) {
      window.open(social.url, '_blank', 'noopener,noreferrer');
    }
  };

  // SVG icons mapping
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'TikTok':
        return (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      case 'LinkedIn':
        return (
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Get color classes based on platform
  const getColorClasses = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return {
          hoverColor: 'group-hover:text-purple-700',
          badgeBg: 'bg-purple-100',
          badgeText: 'text-purple-700',
          hoverIcon: 'group-hover:text-purple-500',
          shadow: 'hover:shadow-purple-500/25'
        };
      case 'TikTok':
        return {
          hoverColor: 'group-hover:text-red-700',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          hoverIcon: 'group-hover:text-red-500',
          shadow: 'hover:shadow-red-500/25'
        };
      case 'LinkedIn':
        return {
          hoverColor: 'group-hover:text-blue-700',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-700',
          hoverIcon: 'group-hover:text-blue-500',
          shadow: 'hover:shadow-blue-500/25'
        };
      default:
        return {
          hoverColor: 'group-hover:text-gray-700',
          badgeBg: 'bg-gray-100',
          badgeText: 'text-gray-700',
          hoverIcon: 'group-hover:text-gray-500',
          shadow: 'hover:shadow-gray-500/25'
        };
    }
  };

  return (
    <section className="bg-white py-24 relative overflow-hidden">
      <div className="w-full px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Left-aligned Title and Subtitle */}
          <div className="mb-16 max-w-2xl">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl text-gray-900 mb-6 leading-tight">
              {t('followUs.title')}
            </h2>
            <p className="text-xl lg:text-2xl text-gray-400 leading-relaxed">
              {t('followUs.subtitle')}
            </p>
          </div>

          {/* Frosted Glass Social Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl">
            {socials.map((social, index) => {
              const colorClasses = getColorClasses(social.platform);
              const isLinkedIn = social.platform === 'LinkedIn';
              
              return (
                <button
                  key={social.platform}
                  onClick={() => handleSocialClick(social)}
                  className={`group relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 hover:bg-white/30 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:-translate-y-2 hover:shadow-2xl ${colorClasses.shadow}`}
                >
                  <div className={`absolute inset-0 ${social.gradients}/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  <div className="relative z-10 text-center space-y-6">
                    <div className={`w-16 h-16 mx-auto ${social.gradients} rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-lg`}>
                      {getSocialIcon(social.platform)}
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className={`text-2xl text-gray-900 ${colorClasses.hoverColor} transition-colors duration-300`}>
                        {social.platform}
                      </h3>
                      <div className={`inline-block px-4 py-2 ${colorClasses.badgeBg} ${colorClasses.badgeText} rounded-full text-sm`}>
                        {social.handle}
                      </div>
                    </div>

                    <div className={`absolute top-4 right-4 w-6 h-6 text-gray-400 ${colorClasses.hoverIcon} transition-colors duration-300`}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
