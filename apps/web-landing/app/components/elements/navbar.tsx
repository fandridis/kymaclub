import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { Menu, X, Globe, Home, Info, Handshake, Users, ArrowRight } from 'lucide-react';

interface NavigationProps {
  className?: string;
}

export function Navigation({
  className = ""
}: NavigationProps) {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    // Close mobile menu if open
    setIsMobileMenuOpen(false);

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
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  const handleNavigationClick = () => {
    // Close mobile menu when navigation link is clicked
    setIsMobileMenuOpen(false);
  };

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
    <>
      <div className={`px-6 py-8 ${className} fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getGlassEffectClasses()}`}>
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="KymaClub" className="h-12 w-auto" />
            <span className={`text-2xl tracking-tight hidden md:block ${isDarkPage ? 'text-white' : 'text-gray-900'}`}>
              KymaClub
            </span>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-8 text-sm">
            <Link
              to="/"
              className={`font-medium hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t('navigation.home')}
            </Link>
            <Link
              to="/how-it-works"
              className={`font-medium hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t('navigation.howItWorks')}
            </Link>
            <Link
              to="/partners"
              className={`font-medium hover:opacity-80 transition-colors ${isDarkPage ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {t('navigation.partnerWithUs')}
            </Link>
            <button
              onClick={handleLanguageToggle}
              className={`text-xs border px-3 py-1.5 rounded-full hover:opacity-80 transition-all duration-200 font-medium flex items-center gap-1 ${isDarkPage
                ? 'border-white/30 text-white hover:bg-white/10'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Globe className="h-3 w-3" />
              {currentLanguage === 'gr' ? 'EN' : 'GR'}
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={handleJoinWaitlist}
                className={`h-11 px-5 rounded-full transition-all duration-300 font-medium ${isDarkPage
                  ? 'bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20'
                  : 'bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200'
                  }`}
              >
                <span className="hidden lg:block">{t('navigation.joinWaitlist')}</span>
                <span className="lg:hidden">Join</span>
              </Button>
              <Button
                onClick={handlePartnerClick}
                className={`h-11 px-5 rounded-full transition-all duration-300 font-medium ${isDarkPage
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                <span className="hidden lg:block">{t('navigation.partnerWithUsButton')}</span>
                <span className="lg:hidden">Partner</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden h-11 w-11 rounded-full transition-all duration-300 ${isDarkPage ? 'text-white hover:bg-white/10 active:bg-white/20' : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'} ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}
            >
              <div className="relative">
                <Menu className={`h-6 w-6 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 rotate-45' : 'opacity-100 rotate-0'}`} />
                <X className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-45'}`} />
              </div>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 top-0 z-1000 lg:hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setIsMobileMenuOpen(false)}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />

        {/* Mobile Menu Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl transform transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          role="navigation"
          aria-label="Mobile navigation menu"
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <img src="/logo-icon.svg" alt="KymaClub" className="h-8 w-auto" />
              <span className="text-xl font-semibold text-gray-900">KymaClub</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-600 hover:bg-white/50 rounded-full h-10 w-10"
            >
              <X className="h-8 w-8" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          {/* Menu Content */}
          <div className="flex flex-col h-full">
            {/* Navigation Links */}
            <nav className="flex flex-col p-2 mt-4">
              <Link
                to="/"
                onClick={handleNavigationClick}
                className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 transition-all duration-200 group"
              >
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  <Home className="h-4 w-4" />
                </div>
                <span className="font-medium">{t('navigation.home')}</span>
                <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/how-it-works"
                onClick={handleNavigationClick}
                className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 transition-all duration-200 group"
              >
                <div className="p-2 rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                  <Info className="h-4 w-4" />
                </div>
                <span className="font-medium">{t('navigation.howItWorks')}</span>
                <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/partners"
                onClick={handleNavigationClick}
                className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600 transition-all duration-200 group"
              >
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                  <Handshake className="h-4 w-4" />
                </div>
                <span className="font-medium">{t('navigation.partnerWithUs')}</span>
                <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1" />
              </Link>
            </nav>

            {/* Language Toggle */}
            <div className="px-6 py-4 border-t border-gray-100 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </span>
              </div>
              <button
                onClick={handleLanguageToggle}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all duration-200 text-gray-700 hover:text-gray-900"
              >
                <span className="font-medium">
                  {currentLanguage === 'gr' ? 'Ελληνικά' : 'English'}
                </span>
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 p-6 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50">
              <Button
                onClick={handleJoinWaitlist}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border border-gray-300 hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {t('navigation.joinWaitlist')}
              </Button>
              <Button
                onClick={handlePartnerClick}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                <Handshake className="h-4 w-4" />
                {t('navigation.partnerWithUsButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}