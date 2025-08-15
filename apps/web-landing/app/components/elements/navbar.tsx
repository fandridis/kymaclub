import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavigationProps {
  className?: string;
}

export function Navigation({
  className = ""
}: NavigationProps) {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Add scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageToggle = () => {
    const nextLanguage = currentLanguage === 'gr' ? 'en' : 'gr';
    changeLanguage(nextLanguage);
  };

  const handlePartnerClick = () => {
    // If not on partners page, navigate there first
    if (location.pathname !== '/partners') {
      navigate('/partners');
      // Wait for navigation to complete, then scroll to form
      setTimeout(() => {
        const formSection = document.getElementById('partner-form-section');
        if (formSection) {
          formSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on partners page, just scroll to form
      const formSection = document.getElementById('partner-form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleJoinWaitlist = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  // Determine if we're on a page with dark background
  const isDarkPage = location.pathname === '/';

  // Glass effect classes based on scroll state and page theme
  const getGlassEffectClasses = () => {
    if (!isScrolled) return '';

    return isDarkPage
      ? 'bg-black/50 backdrop-blur-md border-b border-white/20'
      : 'bg-white/80 backdrop-blur-md border-b border-gray-100';
  };

  return (
    <div className={`px-6 py-8 ${className} fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getGlassEffectClasses()}`}>
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-icon.svg" alt="KymaClub" className="h-12 w-auto" />
          <span className={`text-2xl tracking-tight ${isDarkPage ? 'text-white' : 'text-gray-900'}`}>
            KymaClub
          </span>
        </Link>

        {/* Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-8 text-sm">
          <Link
            to="/"
            className={`hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('navigation.home')}
          </Link>
          <Link
            to="/how-it-works"
            className={`hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('navigation.howItWorks')}
          </Link>
          {/* <a 
            href="#membership" 
            className={`hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Συνδρομή
          </a> */}
          <Link
            to="/partners"
            className={`hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {t('navigation.partnerWithUs')}
          </Link>

          {/* <a 
            href="#credits" 
            className={`hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Credits
          </a> */}
          {/* <a 
            href="#faq" 
            className={`hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            FAQ
          </a> */}
          <button
            onClick={handleLanguageToggle}
            className={`text-xs border px-3 py-1 rounded-full hover:opacity-80 transition-colors ${isDarkPage
                ? 'border-white/30 text-white hover:bg-white/10'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
          >
            {currentLanguage === 'gr' ? 'EN' : 'GR'}
          </button>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleJoinWaitlist}
            className={`h-11 px-6 rounded-full transition-all duration-300 ${isDarkPage
                ? 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20'
                : 'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200'
              }`}
          >
            {t('navigation.joinWaitlist')}
          </Button>
          <Button
            onClick={handlePartnerClick}
            className={`h-11 px-6 rounded-full transition-all duration-300 ${isDarkPage
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            {t('navigation.partnerWithUsButton')}
          </Button>
        </div>
      </div>
    </div>
  );
}