import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface ApiResponse {
  success: boolean;
  message?: string;
  pageId?: string;
}

export const WaitingListSection = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await fetch('/api/createNotionPageToDB', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json() as ApiResponse;

      if (data.success) {
        setSubmitStatus('success');
        setSubmitMessage(t('waitingList.form.success'));
        // Clear form on success
        setEmail('');
        setName('');
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.message || t('waitingList.form.error'));
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      setSubmitMessage(t('waitingList.form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-black py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center space-y-12">
          <div>
            <h2 className="text-6xl sm:text-7xl mb-6 tracking-tight text-white">
              {t('waitingList.title')} <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t('waitingList.titleColored')}</span>
            </h2>
            <p className="text-xl text-gray-400">{t('waitingList.subtitle')}</p>
          </div>

          {/* Email Form */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-4 flex-wrap">
                <Input
                  type="email"
                  placeholder={t('waitingList.form.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full text-lg focus:bg-white/20 focus:border-white/40 disabled:opacity-50"
                />
                <Input
                  type="text"
                  placeholder={t('waitingList.form.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-full text-lg focus:bg-white/20 focus:border-white/40 disabled:opacity-50"
                />
              </div>

              {/* Status Message */}
              {submitStatus !== 'idle' && (
                <div className={`text-center p-4 rounded-full ${submitStatus === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                  {submitMessage}
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-white text-black hover:bg-gray-100 rounded-full text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('waitingList.form.submitting') : t('waitingList.form.submit')}
              </Button>
            </form>

            <div className="flex justify-center gap-8 mt-8 text-sm text-gray-400">
              <span>{t('waitingList.features.noSpam')}</span>
              <span>{t('waitingList.features.earlyMemberPerks')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}