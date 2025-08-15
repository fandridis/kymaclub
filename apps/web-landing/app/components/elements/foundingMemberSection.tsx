import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function FoundingMemberSection() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');

    const handleFoundingMemberSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Email:', email);
        alert(t('foundingMember.form.success'));
      };
      
    return (
        <section className="bg-gradient-to-r from-neutral-900 to-gray-800 py-20">
        <div className="w-full px-8">
          <div className="text-center space-y-12">
            <div>
              <h2 className="text-5xl sm:text-6xl lg:text-8xl mb-6 tracking-tight text-white">
                {t('foundingMember.title')}<br/>
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Founding Member
                </span>
              </h2>
              <p className="text-xl lg:text-2xl text-white/60 max-w-4xl mx-auto">
                {t('foundingMember.subtitle')}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-6">🎯</div>
                <h3 className="text-white mb-3 text-xl">{t('foundingMember.benefits.earlyAccess.title')}</h3>
                <p className="text-white/60">{t('foundingMember.benefits.earlyAccess.description')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-6">💰</div>
                <h3 className="text-white mb-3 text-xl">{t('foundingMember.benefits.specialPricing.title')}</h3>
                <p className="text-white/60">{t('foundingMember.benefits.specialPricing.description')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-6">✨</div>
                <h3 className="text-white mb-3 text-xl">{t('foundingMember.benefits.vipTreatment.title')}</h3>
                <p className="text-white/60">{t('foundingMember.benefits.vipTreatment.description')}</p>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 w-full max-w-4xl">
                <form onSubmit={handleFoundingMemberSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      type="email"
                      placeholder={t('foundingMember.form.emailPlaceholder')}
                      required
                      className="h-14 bg-white/10 border-white/30 text-white placeholder:text-white/60 rounded-full text-lg focus:bg-white/20 focus:border-white/50"
                    />
                  
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-16 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white rounded-full text-lg transition-all duration-300 shadow-2xl"
                  >
                    {t('foundingMember.form.submit')}
                  </Button>
                </form>

                <div className="flex justify-center gap-8 mt-8 text-sm text-white/60">
                  <span>{t('foundingMember.features.limitedSpots')}</span>
                  <span>{t('foundingMember.features.exclusiveBenefits')}</span>
                  <span>{t('foundingMember.features.lifetimePerks')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
}