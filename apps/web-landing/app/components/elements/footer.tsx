import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import logo from '../../../public/logo-icon.svg';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-white text-black py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-8 mb-16">
          {/* Logo Column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="KymaClub" className="h-10 w-auto" />
              <span className="text-2xl tracking-tight">KymaClub</span>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <ul className="space-y-4">
              <li><Link to="/partners" className="text-gray-600 hover:text-black transition-colors">{t('footer.partnerWithUs')}</Link></li>
              <li><Link to="/careers" className="text-gray-600 hover:text-black transition-colors">{t('footer.careers')}</Link></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-4">
              <li><Link to="/about-us" className="text-gray-600 hover:text-black transition-colors">{t('footer.aboutUs')}</Link></li>
              {/* <li><a href="#gift" className="text-gray-600 hover:text-black transition-colors">Κάρτα δώρων</a></li> */}
              <li className="text-gray-600">{t('footer.followUs')}</li>
              <li className="text-gray-600 hover:text-black transition-colors">
                <div className="flex space-x-4 items-center">
                  <a href="https://www.instagram.com/kymaclub" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/company/kymaclub" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a href="https://www.tiktok.com/@kyma.club?_t=ZN-8yqXqL4DWzO&_r=1" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 015.17-2.39V12.1a6.32 6.32 0 00-1.2-.12c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6V8.73a8.48 8.48 0 004.88 1.52V6.69a4.85 4.85 0 01-2.43-.64z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              </li>

            </ul>
          </div>
          {/* <div className="lg:col-span-2">
            <ul className="space-y-4">
              <li><a href="#follow" className="text-gray-600 hover:text-black transition-colors">Follow us</a></li>
            </ul>
          </div> */}
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-200 pt-8 text-center space-y-4">
          <p className="text-gray-600">
            {t('footer.tagline')}
          </p>
          <p className="text-sm text-gray-400">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
} 