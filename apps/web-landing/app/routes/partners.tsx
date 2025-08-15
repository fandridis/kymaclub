import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import type { Route } from '../+types/root';

interface ApiResponse {
  success: boolean;
  message?: string;
  pageId?: string;
}

interface StudiosProps {
  onBack: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Συνεργάσου μαζί μας | KymaClub" },
    { name: "description", content: "Ενώσου με την wellness revolution! Φέρε το studio σου στην πιο innovative πλατφόρμα της Ελλάδας και ανακάλυψε νέες δυνατότητες για το business σου 🚀" },
  ];
}

export default function Studios({ onBack, currentPage, setCurrentPage }: StudiosProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    area: '',
    website: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const features = [
    {
      id: 1,
      image: '/meet.png',
      title: t('partners.features.meeting.title'),
      description: t('partners.features.meeting.description'),
    },
    {
      id: 2,
      image: '/schedule.png',
      title: t('partners.features.availability.title'),
      description: t('partners.features.availability.description'),
    },
    {
      id: 3,
      image: '/get-paid.png',
      title: t('partners.features.payment.title'),
      description: t('partners.features.payment.description'),
    },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Business Registration Data:', formData);
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      console.log('About to make fetch request...'); // Debug log
      console.log('Form data being sent:', formData); // Debug log
      
      const response = await fetch('/api/createNotionPageToPartnerDB', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Fetch completed, status:', response.status); // Debug log

      const data = await response.json() as ApiResponse;
      console.log('Response data:', data); // Debug log

      if (data.success) {
        setSubmitStatus('success');
        setSubmitMessage(t('partners.form.success'));
        // Clear form on success
        setFormData({
          name: '',
          email: '',
          phone: '',
          area: '',
          website: '',
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.message || t('partners.form.error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    
      setSubmitStatus('error');
      setSubmitMessage(t('partners.form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Hero Section - Full Width */}
      <section className="pt-40 pb-16 px-8 bg-white">
        <div className="w-full text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-8xl leading-none tracking-tight text-gray-900">
          <span className="bg-gradient-to-r from-purple-600 via-green-600 to-blue-600 bg-clip-text text-transparent">{t('partners.hero.title')} </span> <br/> <br/>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {t('partners.hero.subtitle')}
          </p>
        </div>
      </section>

            {/* Benefits Section */}
            <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight text-gray-900">
            {t('partners.benefits.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('partners.benefits.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => (
            <div 
              key={feature.id}
              className="h-[500px] flex flex-wrap relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/30 transition-all duration-300 overflow-hidden group"
              style={{
                backgroundImage: `url(${feature.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'top',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* Overlay for better text readability */}
              <div className="flex-1 absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all duration-300"></div>
              
              {/* Content */}
              <div className="relative z-10 mt-auto">
                <h3 className="text-3xl mb-6 tracking-tight text-white">{feature.title}</h3>
                <p className="text-gray-200 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
            ))}
          </div>
  
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="partner-form-section" className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Form Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl mb-6 tracking-tight text-gray-900">
            {t('partners.form.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('partners.form.subtitle')}
            </p>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Business Information Section */}
              <div className="space-y-6">
                <h3 className="text-2xl text-gray-900 mb-6">{t('partners.form.businessInfo')}</h3>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      {t('partners.form.fields.businessName')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder={t('partners.form.fields.businessNamePlaceholder')}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="h-14 bg-gray-50 border-2 border-gray-200 focus:border-purple-400 rounded-2xl text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      {t('partners.form.fields.area')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                    type="text"
                    placeholder={t('partners.form.fields.areaPlaceholder')}
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    className="h-14 bg-gray-50 border-2 border-gray-200 focus:border-purple-400 rounded-2xl text-lg"
                  />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      {t('partners.form.fields.email')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder={t('partners.form.fields.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="h-14 bg-gray-50 border-2 border-gray-200 focus:border-purple-400 rounded-2xl text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      {t('partners.form.fields.phone')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder={t('partners.form.fields.phonePlaceholder')}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                      className="h-14 bg-gray-50 border-2 border-gray-200 focus:border-purple-400 rounded-2xl text-lg"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
        
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      {t('partners.form.fields.website')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('partners.form.fields.websitePlaceholder')}
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      required
                      className="h-14 bg-gray-50 border-2 border-gray-200 focus:border-purple-400 rounded-2xl text-lg"
                    />
                  </div>
                </div>

                {/* Status Message */}
                {submitStatus !== 'idle' && (
                  <div className={`text-center p-4 rounded-2xl ${
                    submitStatus === 'success' 
                      ? 'bg-green-500/20 text-green-700 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-700 border border-red-500/30'
                  }`}>
                    {submitMessage}
                  </div>
                )}

        {/* Terms and Submit */}
        <div className="space-y-6 pt-6 border-t border-gray-200">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 bg-gradient-to-r from-purple-600 via-green-600 to-blue-600 hover:from-purple-700 hover:via-green-700 hover:to-blue-700 text-white rounded-2xl text-lg transition-all duration-300 shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t('partners.form.submitting') : t('partners.form.submit')}
                </Button>
              </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}